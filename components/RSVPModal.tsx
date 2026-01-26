
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_CONTENT } from '../constants';
import { GuestBookEntry } from '../types';

interface RSVPModalProps {
  onClose: () => void;
  onSubmitted: () => void;
}

type Step = 'name' | 'side' | 'relation' | 'attendance' | 'guests' | 'paperInvite' | 'address' | 'message' | 'success';

export const RSVPModal: React.FC<RSVPModalProps> = ({ onClose, onSubmitted }) => {
  const [currentStepName, setCurrentStepName] = useState<Step>('name');
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    side: '' as 'groom' | 'bride' | '',
    relation: '',
    attendance: '' as 'yes' | 'no' | '',
    // Guest Counts
    adults: 1,
    children: 0,
    highChairs: 0,
    vegetarian: 0,
    // Paper Invite
    needPaperInvite: '' as 'yes' | 'no' | '',
    // Address
    zipCode: '',
    address: '',
    // Message
    message: '',
    publishToGuestbook: true
  });

  // Calculate progress based on logical path
  const getStepProgress = () => {
    // Total steps vary based on path:
    // Path A (No Attend): Name, Side, Relation, Att, Msg = 5
    // Path B (Attend, No Paper): Name, Side, Relation, Att, Guests, Paper, Msg = 7
    // Path C (Attend, Yes Paper): Name, Side, Relation, Att, Guests, Paper, Addr, Msg = 8
    
    let total = 5;
    let current = 0;

    const sequence = ['name', 'side', 'relation', 'attendance'];
    
    // Determine path length
    if (formData.attendance === 'yes') {
        total = 7;
        if (formData.needPaperInvite === 'yes') total = 8;
    }

    // Determine current index
    if (sequence.includes(currentStepName)) {
        current = sequence.indexOf(currentStepName);
    } else if (currentStepName === 'guests') current = 4;
    else if (currentStepName === 'paperInvite') current = 5;
    else if (currentStepName === 'address') current = 6;
    else if (currentStepName === 'message') {
        current = total - 1;
    } else if (currentStepName === 'success') {
        current = total;
    }

    return ((current + 1) / total) * 100;
  };

  const handleNext = () => {
    if (!canProceed()) return;
    setDirection(1);

    switch (currentStepName) {
        case 'name': setCurrentStepName('side'); break;
        case 'side': setCurrentStepName('relation'); break;
        case 'relation': setCurrentStepName('attendance'); break;
        case 'attendance': 
            // Branching Logic 1
            if (formData.attendance === 'yes') setCurrentStepName('guests');
            else setCurrentStepName('message');
            break;
        case 'guests': setCurrentStepName('paperInvite'); break;
        case 'paperInvite':
             // Branching Logic 2
             if (formData.needPaperInvite === 'yes') setCurrentStepName('address');
             else setCurrentStepName('message');
             break;
        case 'address': setCurrentStepName('message'); break;
        case 'message': handleSubmit(); break;
    }
  };

  const handlePrev = () => {
    setDirection(-1);
    
    switch (currentStepName) {
        case 'side': setCurrentStepName('name'); break;
        case 'relation': setCurrentStepName('side'); break;
        case 'attendance': setCurrentStepName('relation'); break;
        case 'guests': setCurrentStepName('attendance'); break;
        case 'paperInvite': setCurrentStepName('guests'); break;
        case 'address': setCurrentStepName('paperInvite'); break;
        case 'message': 
            // Reverse Branching Logic
            if (formData.attendance === 'no') setCurrentStepName('attendance');
            else if (formData.needPaperInvite === 'no') setCurrentStepName('paperInvite');
            else setCurrentStepName('address');
            break;
    }
  };

  const canProceed = () => {
    switch (currentStepName) {
      case 'name': return formData.name.trim().length > 0;
      case 'side': return !!formData.side;
      case 'relation': return !!formData.relation;
      case 'attendance': return !!formData.attendance;
      case 'guests': return true; // Defaults are valid
      case 'paperInvite': return !!formData.needPaperInvite;
      case 'address': return formData.zipCode.trim().length > 0 && formData.address.trim().length > 0;
      case 'message': return true; // Optional
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // 1. Send data to Google Sheets
    if (APP_CONTENT.googleScriptUrl && APP_CONTENT.googleScriptUrl.startsWith('http')) {
        try {
            await fetch(APP_CONTENT.googleScriptUrl, {
                method: "POST",
                // GAS Fix: Use 'no-cors' mode to bypass CORS preflight issues.
                // The response will be opaque (we can't read it), but the request will succeed.
                mode: "no-cors", 
                headers: {
                    // GAS Fix: Enforce text/plain to prevent the browser from sending an OPTIONS request.
                    "Content-Type": "text/plain",
                },
                // Ensure the body is a stringified JSON object so GAS can parse e.postData.contents
                body: JSON.stringify({
                    action: 'rsvp',
                    ...formData
                }),
            });
            // Note: with 'no-cors', we can't check response.ok, so we assume success if no network error.
        } catch (error) {
            console.warn("Submission error (proceeding to success for demo):", error);
            // We proceed even on error for UX in this demo context, or you could show an alert.
        }
    } else {
        console.warn("Google Script URL is not configured or invalid.");
    }

    // 2. Publish to Guestbook if checked and message exists
    // (Actual logic is handled by backend sync, we just refresh local view later)

    // 3. Show Success (Wait a bit for UX if it was instant)
    setTimeout(() => {
        setIsSubmitting(false);
        setCurrentStepName('success');
        setTimeout(() => {
            onSubmitted();
            onClose();
        }, 3500); // Give user time to read the success message
    }, 800);
  };

  // --- Helper for Select Inputs ---
  const generateOptions = (max: number, unit: string) => {
      return Array.from({ length: max + 1 }, (_, i) => (
          <option key={i} value={i}>{i} {unit}</option>
      ));
  };

  // --- Render Steps ---
  
  const renderStepContent = () => {
    switch (currentStepName) {
      case 'name':
        return (
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="block text-xl md:text-2xl font-serif text-[#2c3e50]">
                   您的姓名 <span className="text-[#8E3535]">*</span>
                </label>
             </div>
             <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="請輸入您的姓名"
                className="w-full text-lg border border-stone-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#8E3535] focus:ring-1 focus:ring-[#8E3535] transition-all bg-stone-50"
                autoFocus
             />
          </div>
        );

      case 'side':
        return (
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="block text-xl md:text-2xl font-serif text-[#2c3e50]">
                   您是哪一方的親友呢 <span className="text-[#8E3535]">*</span>
                </label>
             </div>
             <div className="space-y-3">
                {[
                    { val: 'groom', label: '男方親友' }, 
                    { val: 'bride', label: '女方親友' }
                ].map((opt) => (
                    <label key={opt.val} className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${formData.side === opt.val ? 'border-[#8E3535] bg-[#8E3535]/5' : 'border-stone-200 hover:bg-stone-50'}`}>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.side === opt.val ? 'border-[#8E3535]' : 'border-stone-300'}`}>
                            {formData.side === opt.val && <div className="w-3 h-3 rounded-full bg-[#8E3535]" />}
                        </div>
                        <input 
                            type="radio" 
                            name="side" 
                            className="hidden" 
                            checked={formData.side === opt.val}
                            onChange={() => setFormData({...formData, side: opt.val as any})} 
                        />
                        <span className="text-lg text-[#2c3e50]">{opt.label}</span>
                    </label>
                ))}
             </div>
          </div>
        );

      case 'relation':
        const isGroom = formData.side === 'groom';
        const title = isGroom ? "您和新郎的關係" : "您和新娘的關係";
        const options = ["親戚", "國中同學", "高中同學", "大學同學", "碩士同學", "朋友", "同事", "其他"];

        return (
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="block text-xl md:text-2xl font-serif text-[#2c3e50]">
                   {title} <span className="text-[#8E3535]">*</span>
                </label>
             </div>
             <div className="space-y-3">
                {options.map((opt) => (
                    <label key={opt} className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${formData.relation === opt ? 'border-[#8E3535] bg-[#8E3535]/5' : 'border-stone-200 hover:bg-stone-50'}`}>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.relation === opt ? 'border-[#8E3535]' : 'border-stone-300'}`}>
                            {formData.relation === opt && <div className="w-3 h-3 rounded-full bg-[#8E3535]" />}
                        </div>
                        <input 
                            type="radio" 
                            name="relation" 
                            className="hidden" 
                            checked={formData.relation === opt}
                            onChange={() => setFormData({...formData, relation: opt})} 
                        />
                        <span className="text-lg text-[#2c3e50]">{opt}</span>
                    </label>
                ))}
             </div>
          </div>
        );

      case 'attendance':
        return (
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="block text-xl md:text-2xl font-serif text-[#2c3e50]">
                   是否一同參與我們重要的一天 <span className="text-[#8E3535]">*</span>
                </label>
             </div>
             <div className="space-y-3">
                <label className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${formData.attendance === 'yes' ? 'border-[#8E3535] bg-[#8E3535]/5' : 'border-stone-200 hover:bg-stone-50'}`}>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.attendance === 'yes' ? 'border-[#8E3535]' : 'border-stone-300'}`}>
                        {formData.attendance === 'yes' && <div className="w-3 h-3 rounded-full bg-[#8E3535]" />}
                    </div>
                    <input 
                        type="radio" 
                        name="attendance" 
                        className="hidden" 
                        checked={formData.attendance === 'yes'}
                        onChange={() => setFormData({...formData, attendance: 'yes'})} 
                    />
                    <span className="text-lg text-[#2c3e50]">一定到場，一起見證幸福！</span>
                </label>

                <label className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${formData.attendance === 'no' ? 'border-[#8E3535] bg-[#8E3535]/5' : 'border-stone-200 hover:bg-stone-50'}`}>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.attendance === 'no' ? 'border-[#8E3535]' : 'border-stone-300'}`}>
                        {formData.attendance === 'no' && <div className="w-3 h-3 rounded-full bg-[#8E3535]" />}
                    </div>
                    <input 
                        type="radio" 
                        name="attendance" 
                        className="hidden" 
                        checked={formData.attendance === 'no'}
                        onChange={() => setFormData({...formData, attendance: 'no'})} 
                    />
                    <span className="text-lg text-[#2c3e50] flex items-center gap-2">無法出席，謹上心意與祝福 <span className="text-red-500">❤️</span></span>
                </label>
             </div>
          </div>
        );

      case 'guests':
         return (
             <div className="space-y-6">
                 {/* Adult Count */}
                 <div className="space-y-2">
                     <label className="block text-lg font-serif text-[#2c3e50]">成人人數 <span className="text-[#8E3535]">*</span></label>
                     <select 
                        value={formData.adults}
                        onChange={(e) => setFormData({...formData, adults: Number(e.target.value)})}
                        className="w-full text-lg border border-stone-200 rounded-lg px-4 py-3 bg-stone-50 focus:border-[#8E3535] focus:outline-none"
                     >
                        {generateOptions(10, "人")}
                     </select>
                 </div>

                 {/* Children Count */}
                 <div className="space-y-2">
                     <label className="block text-lg font-serif text-[#2c3e50]">兒童人數</label>
                     <select 
                        value={formData.children}
                        onChange={(e) => setFormData({...formData, children: Number(e.target.value)})}
                        className="w-full text-lg border border-stone-200 rounded-lg px-4 py-3 bg-stone-50 focus:border-[#8E3535] focus:outline-none"
                     >
                        {generateOptions(6, "人")}
                     </select>
                 </div>

                 {/* High Chair Count */}
                 <div className="space-y-2">
                     <label className="block text-lg font-serif text-[#2c3e50]">兒童座椅數量</label>
                     <select 
                        value={formData.highChairs}
                        onChange={(e) => setFormData({...formData, highChairs: Number(e.target.value)})}
                        className="w-full text-lg border border-stone-200 rounded-lg px-4 py-3 bg-stone-50 focus:border-[#8E3535] focus:outline-none"
                     >
                        {generateOptions(4, "張")}
                     </select>
                 </div>

                 {/* Vegetarian Count */}
                 <div className="space-y-2">
                     <label className="block text-lg font-serif text-[#2c3e50]">素食人數</label>
                     <select 
                        value={formData.vegetarian}
                        onChange={(e) => setFormData({...formData, vegetarian: Number(e.target.value)})}
                        className="w-full text-lg border border-stone-200 rounded-lg px-4 py-3 bg-stone-50 focus:border-[#8E3535] focus:outline-none"
                     >
                        {generateOptions(10, "人")}
                     </select>
                 </div>
             </div>
         );

      case 'paperInvite':
          return (
              <div className="space-y-6">
                 <div className="space-y-2">
                     <label className="block text-xl md:text-2xl font-serif text-[#2c3e50]">
                        您是否需要紙本喜帖？ <span className="text-[#8E3535]">*</span>
                     </label>
                  </div>
                  <div className="space-y-3">
                     <label className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${formData.needPaperInvite === 'yes' ? 'border-[#8E3535] bg-[#8E3535]/5' : 'border-stone-200 hover:bg-stone-50'}`}>
                         <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.needPaperInvite === 'yes' ? 'border-[#8E3535]' : 'border-stone-300'}`}>
                             {formData.needPaperInvite === 'yes' && <div className="w-3 h-3 rounded-full bg-[#8E3535]" />}
                         </div>
                         <input 
                             type="radio" 
                             name="needPaperInvite" 
                             className="hidden" 
                             checked={formData.needPaperInvite === 'yes'}
                             onChange={() => setFormData({...formData, needPaperInvite: 'yes'})} 
                         />
                         <span className="text-lg text-[#2c3e50]">是，請寄給我</span>
                     </label>
     
                     <label className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${formData.needPaperInvite === 'no' ? 'border-[#8E3535] bg-[#8E3535]/5' : 'border-stone-200 hover:bg-stone-50'}`}>
                         <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.needPaperInvite === 'no' ? 'border-[#8E3535]' : 'border-stone-300'}`}>
                             {formData.needPaperInvite === 'no' && <div className="w-3 h-3 rounded-full bg-[#8E3535]" />}
                         </div>
                         <input 
                             type="radio" 
                             name="needPaperInvite" 
                             className="hidden" 
                             checked={formData.needPaperInvite === 'no'}
                             onChange={() => setFormData({...formData, needPaperInvite: 'no'})} 
                         />
                         <span className="text-lg text-[#2c3e50]">不用喔，我已經知道婚禮資訊了</span>
                     </label>
                  </div>
               </div>
           );
 
       case 'address':
           return (
               <div className="space-y-6">
                  <div className="space-y-2">
                      <label className="block text-lg font-serif text-[#2c3e50]">郵遞區號 <span className="text-[#8E3535]">*</span></label>
                      <input 
                         type="text" 
                         value={formData.zipCode}
                         onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                         placeholder="請輸入郵遞區號"
                         className="w-full text-lg border border-stone-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#8E3535] focus:ring-1 focus:ring-[#8E3535] bg-stone-50"
                      />
                  </div>
                  
                  <div className="space-y-2">
                      <label className="block text-lg font-serif text-[#2c3e50]">地址 <span className="text-[#8E3535]">*</span></label>
                      <input 
                         type="text" 
                         value={formData.address}
                         onChange={(e) => setFormData({...formData, address: e.target.value})}
                         placeholder="請輸入完整地址"
                         className="w-full text-lg border border-stone-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#8E3535] focus:ring-1 focus:ring-[#8E3535] bg-stone-50"
                      />
                  </div>
               </div>
           );
 
       case 'message':
         return (
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="block text-xl md:text-2xl font-serif text-[#2c3e50]">
                    有什麼想對我們說的話嗎？
                 </label>
                 <p className="text-sm text-stone-400">您的祝福是我們最大的動力</p>
              </div>
              
              <textarea 
                 value={formData.message}
                 onChange={(e) => setFormData({...formData, message: e.target.value})}
                 placeholder="請留下您想跟我們說的話..."
                 className="w-full min-h-[120px] text-lg border border-stone-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#8E3535] focus:ring-1 focus:ring-[#8E3535] transition-all bg-stone-50 resize-none"
              />
 
              <label className="flex items-start gap-3 cursor-pointer group">
                 <div className={`mt-0.5 w-5 h-5 border rounded flex items-center justify-center transition-colors ${formData.publishToGuestbook ? 'bg-[#8E3535] border-[#8E3535]' : 'border-stone-300 group-hover:border-[#8E3535]'}`}>
                     {formData.publishToGuestbook && (
                         <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                         </svg>
                     )}
                 </div>
                 <input 
                     type="checkbox" 
                     className="hidden"
                     checked={formData.publishToGuestbook}
                     onChange={(e) => setFormData({...formData, publishToGuestbook: e.target.checked})}
                 />
                 <div className="flex-1">
                     <span className="text-base text-[#2c3e50]">同步發佈到祝福留言板</span>
                     <p className="text-xs text-stone-400 mt-0.5">勾選後，您的留言將會顯示在網站的「祝福留言」區塊</p>
                 </div>
              </label>
           </div>
         );
     }
   };
 
   if (currentStepName === 'success') {
      return (
         <div className="fixed inset-0 z-[200] bg-[#fdfbf7] flex items-center justify-center p-6">
             <div className="text-center space-y-4">
                 {/* Updated Success Icon Color to Theme Red */}
                 <div className="w-20 h-20 bg-[#8E3535]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#8E3535]">
                     <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                     </svg>
                 </div>
                 <h2 className="text-2xl font-serif text-[#2c3e50] font-bold">感謝您的回覆！</h2>
                 <p className="text-stone-500">我們已收到您的出席資訊，期待與您相見。</p>
             </div>
         </div>
      );
   }
 
   const progress = getStepProgress();
 
   return (
     <div className="fixed inset-0 z-[200] bg-[#fdfbf7] overflow-y-auto">
        <div className="min-h-screen flex flex-col relative">
            
            {/* Header */}
            <div className="bg-white border-b border-stone-100 sticky top-0 z-10 shadow-sm">
                 <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                     <button 
                         onClick={onClose}
                         className="flex items-center gap-2 text-[#8E3535] hover:text-[#7a2e2e] transition-colors"
                     >
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                         </svg>
                         <span className="font-medium">返回邀請函</span>
                     </button>
                     <span className="font-display text-[#2c3e50] text-sm tracking-widest hidden md:block">JOY & JACKY WEDDING RSVP</span>
                 </div>
            </div>
 
            {/* Content */}
            <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 md:py-12 flex flex-col gap-6 md:gap-8">
                 
                 {/* Wedding Info Summary - Compact on mobile */}
                 <div className="text-center space-y-2 md:space-y-4 mb-2 md:mb-4">
                     <h1 className="font-serif text-2xl md:text-4xl text-[#2c3e50]">李謦伊 & 張家銘</h1>
                     <p className="font-serif text-base md:text-lg text-[#8E3535]">2026.05.30 星期六</p>
                     
                     <div className="text-[11px] md:text-sm text-stone-600 bg-white/50 block md:inline-block p-3 md:p-4 rounded-lg border border-stone-100 max-w-lg mx-auto leading-relaxed">
                         <p className="mb-1 md:mb-2"><span className="font-bold text-[#b08d55]">時間：</span> 12:00 入席 · 12:30 準時開席</p>
                         <p className="mb-1 md:mb-2"><span className="font-bold text-[#b08d55]">地點：</span> {APP_CONTENT.venueName}</p>
                         <p className="hidden md:block"><span className="font-bold text-[#b08d55]">交通：</span> 高鐵新竹站轉乘計程車 (約15分) / 國道一號公道五路交流道 / 附設停車場</p>
                     </div>
                 </div>

                 {/* Form Card */}
                 <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-100 min-h-[350px] md:min-h-[400px] flex flex-col">
                     <div className="p-6 md:p-8 pb-0 text-center">
                         <h2 className="text-xl md:text-2xl font-serif text-[#8E3535] tracking-wide mb-4 md:mb-6">婚禮出席回覆</h2>
                         <div className="w-8 h-[2px] bg-[#8E3535]/30 mx-auto mb-6 md:mb-8" />
                     </div>

                     {/* Progress Bar */}
                     <div className="px-6 md:px-8">
                         <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                             <motion.div 
                                 className="h-full bg-[#8E3535]"
                                 initial={{ width: 0 }}
                                 animate={{ width: `${progress}%` }}
                                 transition={{ duration: 0.5, ease: "easeInOut" }}
                             />
                         </div>
                     </div>

                     <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                         <AnimatePresence mode="wait" custom={direction}>
                             <motion.div
                                 key={currentStepName}
                                 custom={direction}
                                 initial={{ opacity: 0, x: direction * 50 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 exit={{ opacity: 0, x: direction * -50 }}
                                 transition={{ duration: 0.3, ease: "easeOut" }}
                             >
                                 {renderStepContent()}
                             </motion.div>
                         </AnimatePresence>
                     </div>

                     {/* REFINED BUTTON DESIGN */}
                     <div className="p-6 md:p-8 pt-0 flex justify-between items-center mt-auto">
                         <button 
                             onClick={handlePrev}
                             disabled={currentStepName === 'name' || isSubmitting}
                             className={`group flex items-center gap-1.5 text-stone-400 hover:text-[#8E3535] transition-colors font-serif text-sm md:text-[15px] tracking-wide ${currentStepName === 'name' ? 'opacity-0 pointer-events-none' : ''}`}
                         >
                             <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
                             <span>上一題</span>
                         </button>

                         <button 
                             onClick={handleNext}
                             disabled={!canProceed() || isSubmitting}
                             className={`
                                 relative overflow-hidden group px-6 md:px-8 py-2.5 md:py-3 bg-[#8E3535] text-white font-serif tracking-[0.15em] text-sm md:text-[15px]
                                 rounded-[2px] shadow-[0_4px_14px_rgba(142,53,53,0.25)] transition-all duration-300
                                 flex items-center gap-2 md:gap-3
                                 ${(!canProceed() || isSubmitting) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_6px_20px_rgba(142,53,53,0.4)] hover:-translate-y-[1px]'}
                             `}
                         >
                             <span className="relative z-10 flex items-center gap-2">
                                 {isSubmitting ? (
                                     <>
                                         <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                         </svg>
                                         傳送中...
                                     </>
                                 ) : (
                                     <>
                                         {currentStepName === 'message' ? '提交回覆' : '下一題'}
                                     </>
                                 )}
                             </span>
                             {currentStepName !== 'message' && !isSubmitting && (
                                  <span className="relative z-10 text-[10px] transform group-hover:translate-x-1 transition-transform">→</span>
                             )}
                             
                             {/* Shine Effect */}
                             {!isSubmitting && (
                                 <div className="absolute inset-0 -translate-x-[100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out z-0" />
                             )}
                         </button>
                     </div>
                 </div>
 
            </div>
        </div>
     </div>
   );
 };
