import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

export interface Website {
  id: string;
  name: string | null;
  domain: string | { 
    id: string;
    name: string;
    verificationStatus: string;
    verificationToken: string | null;
    verifiedAt: string | null;
    userId: string | null;
    projectId: string | null;
    dnsRecords: any;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
  userId?: string | null;
  projectId?: string | null;
  domainId?: string | null;
  createdAt: string;
  updatedAt: string;
  status?: string;
  domainData?: {
    id: string;
    name: string;
    verificationStatus: string;
    verificationToken: string | null;
    verifiedAt: string | null;
    userId: string | null;
    projectId: string | null;
    dnsRecords: any;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  } | null;
}

interface WebsitesStateData {
  selectedWebsite: Website | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isVerifying: boolean;
  isRegenerating: boolean;
  showVerificationDialog: boolean;
}

interface WebsitesStateActions {
  setSelectedWebsite: (website: Website | null) => void;
  setShowVerificationDialog: (show: boolean) => void;
  clearSelectedOnDelete: (id: string) => void; 
  reset: () => void;
  setIsCreating: (creating: boolean) => void;
  setIsUpdating: (updating: boolean) => void;
  setIsDeleting: (deleting: boolean) => void;
  setIsVerifying: (verifying: boolean) => void;
  setIsRegenerating: (regenerating: boolean) => void;
}

export type WebsitesState = WebsitesStateData & WebsitesStateActions;

const initialStateData: WebsitesStateData = {
  selectedWebsite: null,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isVerifying: false,
  isRegenerating: false,
  showVerificationDialog: false,
};

export const useWebsitesStore = create<WebsitesState>((set) => ({
  ...initialStateData,
  setSelectedWebsite: (website) => set({ selectedWebsite: website }),
  setShowVerificationDialog: (show) => set({ showVerificationDialog: show }),
  clearSelectedOnDelete: (id) => set((state) => ({
    selectedWebsite: state.selectedWebsite?.id === id ? null : state.selectedWebsite
  })),
  reset: () => set(initialStateData),
  setIsCreating: (creating) => set({ isCreating: creating }),
  setIsUpdating: (updating) => set({ isUpdating: updating }),
  setIsDeleting: (deleting) => set({ isDeleting: deleting }),
  setIsVerifying: (verifying) => set({ isVerifying: verifying }),
  setIsRegenerating: (regenerating) => set({ isRegenerating: regenerating }),
}));

export const useSelectedWebsite = () => useWebsitesStore(state => state.selectedWebsite);

// Selector for the dialog visibility state
export const useShowVerificationDialog = () => useWebsitesStore(state => state.showVerificationDialog);

// To get the setter for the dialog, a component can use:
// const setShowVerificationDialog = useWebsitesStore(state => state.setShowVerificationDialog);
// Or, if a component needs both, it can use shallow compare:
/*
export const useVerificationDialogCombined = () => useWebsitesStore(state => ({
  show: state.showVerificationDialog,
  setShow: state.setShowVerificationDialog
}), shallow);
*/ 