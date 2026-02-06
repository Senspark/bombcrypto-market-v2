import React, { useState, ReactNode } from "react";
import styled from "styled-components";
import { CSSTransition } from "react-transition-group";

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  z-index: 100000;
`;

const Wrap = styled.div`
  width: 0;
  height: 0;
  position: fixed;
  z-index: 1000000;
`;

interface ModalProps {
  isShowing: boolean;
  hide: () => void;
  children?: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isShowing, hide, children }) => (
  <CSSTransition in={isShowing} timeout={300} classNames="modals" unmountOnExit>
    <Wrap>
      <Overlay onClick={hide} />
    </Wrap>
  </CSSTransition>
);

interface UseModalReturn {
  isShowing: boolean;
  toggle: () => void;
}

export const useModal = (): UseModalReturn => {
  const [isShowing, setIsShowing] = useState(false);

  function toggle() {
    const body = document.getElementsByTagName("BODY")[0];
    if (isShowing) {
      body.classList.remove("open-modal");
    } else {
      body.classList.add("open-modal");
    }
    setIsShowing((state) => !state);
  }

  return {
    isShowing,
    toggle,
  };
};

export default Modal;
