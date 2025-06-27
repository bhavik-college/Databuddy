"use client";

import {
  ChevronLeft,
  Clock,
  Download,
  MessageSquare,
  MoreVertical,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import React, { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getChatDB } from "../lib/chat-db";
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

  if (minutes < 1) return "Just now";
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
  onSelectChat,
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
              const lastUserMessage = messages.filter((m) => m.type === "user").pop();

              return {
                ...chat,
                lastMessage: lastUserMessage?.content || "No messages yet",
              };
            } catch (error) {
              console.error(`Failed to load messages for ${chat.websiteId}:`, error);
              return {
                ...chat,
                lastMessage: "Error loading messages",
              };
            }
          })
        );

        setChatHistory(chatsWithPreview);
      } catch (error) {
        console.error("Failed to load chat history:", error);
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
      setChatHistory((prev) => prev.filter((chat) => chat.websiteId !== websiteId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const handleExportChat = async (websiteId: string, websiteName?: string) => {
    try {
      const exportData = await chatDB.exportChat(websiteId);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-${websiteName || websiteId}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export chat:", error);
    }
  };

  const filteredChats = chatHistory.filter(
    (chat) =>
      chat.websiteName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.websiteId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={0}
      />
      <div className="fixed top-0 left-0 z-50 flex h-full w-full flex-col border-r bg-background shadow-lg sm:w-80">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <Button className="h-8 w-8" onClick={onClose} size="icon" variant="ghost">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="font-semibold">Chat History</h2>
              <p className="text-muted-foreground text-xs">
                {chatHistory.length} {chatHistory.length === 1 ? "chat" : "chats"}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="border-b p-4">
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              value={searchQuery}
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div className="rounded border p-3" key={`skeleton-${i + 1}`}>
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded" />
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
              <div className="py-8 text-center">
                <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  {searchQuery ? "No chats match your search" : "No chat history yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredChats.map((chat) => (
                  <div
                    className={cn(
                      "group cursor-pointer rounded border p-3 transition-all duration-200",
                      "hover:border-primary/20 hover:bg-muted/50",
                      chat.websiteId === currentWebsiteId && "border-primary/30 bg-primary/5"
                    )}
                    key={chat.websiteId}
                    onClick={() => onSelectChat(chat.websiteId, chat.websiteName)}
                    onKeyDown={(e) =>
                      (e.key === "Enter" || e.key === " ") &&
                      onSelectChat(chat.websiteId, chat.websiteName)
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-primary/10">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <h3 className="truncate font-medium text-sm">
                            {chat.websiteName || `Website ${chat.websiteId.slice(0, 8)}`}
                          </h3>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                                size="icon"
                                variant="ghost"
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
                                <Download className="mr-2 h-4 w-4" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm(chat.websiteId);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="mb-2 line-clamp-2 text-muted-foreground text-xs">
                          {chat.lastMessage}
                        </p>
                        <div className="flex items-center justify-between text-muted-foreground text-xs">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>{formatRelativeTime(chat.lastUpdated)}</span>
                          </div>
                          <Badge className="text-xs" variant="secondary">
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
      <AlertDialog onOpenChange={() => setDeleteConfirm(null)} open={!!deleteConfirm}>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && handleDeleteChat(deleteConfirm)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
