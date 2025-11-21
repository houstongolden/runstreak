import { useState, useEffect } from "react";

export default function AnimatedAIChat() {
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    { role: "user", text: "How's my pace improving?" },
    { role: "assistant", text: "Your average pace has improved by 12 seconds per mile over the last 30 days! 🎉" },
    { role: "user", text: "What about my consistency?" },
    { role: "assistant", text: "You've maintained a 47-day streak and averaged 3.2 miles per day. Keep it up!" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto bg-background/60 dark:bg-background/20 backdrop-blur-sm rounded-lg border border-border/50 dark:border-border/20 p-4 shadow-lg">
      <div className="space-y-3">
        {messages.slice(0, messageIndex + 1).map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            style={{ animationDelay: `${idx * 150}ms` }}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Typing indicator */}
      {messageIndex < messages.length - 1 && (
        <div className="flex justify-start mt-3">
          <div className="bg-muted rounded-lg px-4 py-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse" style={{ animationDelay: "200ms" }}></div>
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse" style={{ animationDelay: "400ms" }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
