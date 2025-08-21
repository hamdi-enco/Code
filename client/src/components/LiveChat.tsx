import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send, Headphones } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

export function LiveChat() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages] = useState<Message[]>([
    {
      id: '1',
      text: t('chat.welcomeMessage'),
      sender: 'agent',
      timestamp: new Date(),
    }
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      // In a real implementation, this would send the message to the chat service
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-haramain-green text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-colors"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
      
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-80 shadow-2xl border border-gray-200">
          <div className="bg-haramain-green p-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Headphones className="text-white h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">{t('chat.liveSupport')}</h4>
                  <p className="text-green-100 text-xs">{t('chat.onlineNow')}</p>
                </div>
              </div>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                className="text-white opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-4 h-64 overflow-y-auto">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm text-gray-700">{msg.text}</p>
                  <span className="text-xs text-gray-500">
                    {msg.sender === 'agent' ? t('chat.supportAgent') : 'You'} • Now
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder={t('chat.typeMessage')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 text-sm"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                size="sm"
                className="bg-haramain-green text-white hover:bg-green-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
