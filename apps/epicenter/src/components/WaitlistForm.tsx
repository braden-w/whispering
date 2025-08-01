// "use client";

// import { useState } from "react";
// import { actions } from "astro:actions";
// import { Button } from "@repo/ui/button";
// import { Input } from "@repo/ui/input";
// import { Label } from "@repo/ui/label";
// import { Checkbox } from "@repo/ui/checkbox";
// import { cn } from "@repo/ui/utils";

// const interestOptions = [
//   { id: "notes", label: "Note-taking that connects everything" },
//   { id: "tasks", label: "Task management across projects" },
//   { id: "email", label: "Email client with full context" },
//   { id: "research", label: "Research assistant with memory" },
//   { id: "writing", label: "Writing environment that remembers" },
//   { id: "crm", label: "Personal CRM" },
//   { id: "calendar", label: "Calendar that understands context" },
// ];

// export function WaitlistForm({ className }: { className?: string }) {
//   const [email, setEmail] = useState("");
//   const [interests, setInterests] = useState<string[]>([]);
//   const [otherInterest, setOtherInterest] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitted, setSubmitted] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
    
//     try {
//       const formData = new FormData();
//       formData.append("email", email);
//       interests.forEach(interest => formData.append("interests", interest));
//       if (otherInterest) {
//         formData.append("otherInterest", otherInterest);
//       }
      
//       const result = await actions.joinWaitlist(formData);
//       if (result.data?.success) {
//         setSubmitted(true);
//       }
//     } catch (error) {
//       console.error("Error submitting form:", error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (submitted) {
//     return (
//       <div className={cn("text-center py-12", className)}>
//         <h3 className="text-2xl font-semibold text-gray-900 mb-4">
//           Thanks for joining!
//         </h3>
//         <p className="text-gray-600">
//           We'll let you know when new tools are ready.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
//       <div>
//         <Label htmlFor="email">Email</Label>
//         <Input
//           id="email"
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           placeholder="you@example.com"
//           required
//           className="mt-1"
//         />
//       </div>

//       <div>
//         <Label className="mb-3 block">What tools would help your workflow?</Label>
//         <div className="space-y-3">
//           {interestOptions.map((option) => (
//             <div key={option.id} className="flex items-center space-x-2">
//               <Checkbox
//                 id={option.id}
//                 checked={interests.includes(option.id)}
//                 onCheckedChange={(checked) => {
//                   if (checked) {
//                     setInterests([...interests, option.id]);
//                   } else {
//                     setInterests(interests.filter((i) => i !== option.id));
//                   }
//                 }}
//               />
//               <Label htmlFor={option.id} className="font-normal cursor-pointer">
//                 {option.label}
//               </Label>
//             </div>
//           ))}
          
//           <div className="pt-2">
//             <Label htmlFor="other" className="block mb-1">Other</Label>
//             <Input
//               id="other"
//               type="text"
//               value={otherInterest}
//               onChange={(e) => setOtherInterest(e.target.value)}
//               placeholder="Tell us what else you'd like to see"
//               className="w-full"
//             />
//           </div>
//         </div>
//       </div>

//       <Button 
//         type="submit" 
//         disabled={isSubmitting}
//         className="w-full"
//       >
//         {isSubmitting ? "Joining..." : "Join the waitlist"}
//       </Button>
//     </form>
//   );
// }