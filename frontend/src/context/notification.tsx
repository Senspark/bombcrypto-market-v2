import React, { createContext, useContext, useState, ReactNode, ComponentType } from "react";
import Modal from "../components/modal";
import Notification from "../components/modal/notication";

interface NotificationData {
  message?: string;
  [key: string]: any;
}

interface NotiState {
  type: string;
  isShowing: boolean;
  data: NotificationData;
}

interface NotificationContextValue {
  noti: NotiState;
  setNoti: React.Dispatch<React.SetStateAction<NotiState>>;
  show: (data: Partial<NotiState>) => void;
  hide: () => void;
}

interface NotificationComponentProps {
  hide: () => void;
  data: NotificationData;
}

const mapTypeNoti: Record<string, ComponentType<NotificationComponentProps>> = {
  noti: Notification,
};

export const Notigication = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  type?: string;
}

function NotificationProvider({ children, type }: NotificationProviderProps): JSX.Element {
  const [noti, setNoti] = useState<NotiState>({
    type: "error",
    isShowing: false,
    data: {},
  });

  const toggle = (): void => {
    const notiTemp = { ...noti };
    notiTemp.isShowing = !notiTemp.isShowing;
    setNoti(notiTemp);
  };

  const show = (data: Partial<NotiState>): void => {
    const notiTemp = { ...noti, ...data };
    notiTemp.isShowing = true;
    setNoti(notiTemp);
  };

  const hide = (): void => {
    const notiTemp = { ...noti };
    notiTemp.isShowing = false;
    setNoti(notiTemp);
  };

  const Com = mapTypeNoti[noti.type];

  return (
    <Notigication.Provider value={{ setNoti, noti, show, hide }}>
      {children}
      <Modal isShowing={noti.isShowing} hide={hide}>
        {noti.data && noti.data.message && Com ? (
          <Com hide={toggle} data={noti.data} />
        ) : null}
      </Modal>
    </Notigication.Provider>
  );
}

export const useNoti = (): NotificationContextValue => {
  const notification = useContext(Notigication);
  if (!notification) {
    throw new Error("useNoti must be used within a NotificationProvider");
  }
  return notification;
};

export default NotificationProvider;
