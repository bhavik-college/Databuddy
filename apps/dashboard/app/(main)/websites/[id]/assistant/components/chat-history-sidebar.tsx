"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageSquare, 
  Clock, 
  Trash2, 
  ChevronLeft,
  Search,
  MoreVertical,
  Download,
  Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getChatDB } from "../lib/chat-db";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Message } from "../types/message";

interface ChatHistoryItem {
  websiteId: string;
  websiteName?: string;
  lastUpdated: number;
  messageCount: number;
  lastMessage?: string;
}

interface ChatHistorySidebarProps {
  currentWebsiteId: string;
  currentWebsiteName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (websiteId: string, websiteName?: string) => void;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function ChatHistorySidebar({
  currentWebsiteId,
  currentWebsiteName,
  isOpen,
  onClose,
  onSelectChat
}: ChatHistorySidebarProps) {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const chatDB = getChatDB();

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoading(true);
        const chats = await chatDB.getAllChats();
        
        // Get last message for each chat to show as preview
        const chatsWithPreview = await Promise.all(
          chats.map(async (chat) => {
            try {
              const messages = await chatDB.getMessages(chat.websiteId);
              const lastUserMessage = messages
                .filter(m => m.type === 'user')
                .pop();
              
              return {
                ...chat,
                lastMessage: lastUserMessage?.content || 'No messages yet'
              };
            } catch (error) {
              console.error(`Failed to load messages for ${chat.websiteId}:`, error);
              return {
                ...chat,
                lastMessage: 'Error loading messages'
              };
            }
          })
        );
        
        setChatHistory(chatsWithPreview);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen, chatDB]);

  const handleDeleteChat = async (websiteId: string) => {
    try {
      await chatDB.deleteChat(websiteId);
      setChatHistory(prev => prev.filter(chat => chat.websiteId !== websiteId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const handleExportChat = async (websiteId: string, websiteName?: string) => {
    try {
      const exportData = await chatDB.exportChat(websiteId);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${websiteName || websiteId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export chat:', error);
    }
  };

  const filteredChats = chatHistory.filter(chat =>
    (chat.websiteName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    chat.websiteId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" 
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={0}
      />
      <div className="fixed left-0 top-0 h-full w-full sm:w-80 bg-background border-r shadow-lg z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="font-semibold">Chat History</h2>
              <p className="text-xs text-muted-foreground">
                {chatHistory.length} {chatHistory.length === 1 ? 'chat' : 'chats'}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={`skeleton-${i+1}`} className="p-3 rounded border">
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-8 h-8 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No chats match your search' : 'No chat history yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.websiteId}
                    className={cn(
                      "group p-3 rounded border cursor-pointer transition-all duration-200",
                      "hover:bg-muted/50 hover:border-primary/20",
                      chat.websiteId === currentWebsiteId && "bg-primary/5 border-primary/30"
                    )}
                    onClick={() => onSelectChat(chat.websiteId, chat.websiteName)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectChat(chat.websiteId, chat.websiteName)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-sm truncate">
                            {chat.websiteName || `Website ${chat.websiteId.slice(0, 8)}`}
                          </h3>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportChat(chat.websiteId, chat.websiteName);
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm(chat.websiteId);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {chat.lastMessage}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>{formatRelativeTime(chat.lastUpdated)}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {chat.messageCount} msgs
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat history? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteChat(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 