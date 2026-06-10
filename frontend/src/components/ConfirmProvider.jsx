import React, { createContext, useCallback, useContext } from "react";
import Swal from "sweetalert2";

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const confirm = useCallback((message) => {
    return Swal.fire({
      title: "Confirm",
      text: message,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      allowOutsideClick: false,
      allowEscapeKey: false,
      backdrop: "rgba(0,0,0,0.4)",
    }).then((result) => result.isConfirmed);
  }, []);

  const alert = useCallback((message) => {
    return Swal.fire({
      title: "Notification",
      text: message,
      icon: "info",
      confirmButtonText: "OK",
      confirmButtonColor: "#3085d6",
      allowOutsideClick: false,
      allowEscapeKey: false,
      backdrop: "rgba(0,0,0,0.4)",
    });
  }, []);

  const handleAnswer = (answer) => {
    if (confirmState.resolve) {
      confirmState.resolve(answer);
    }
    setConfirmState({ open: false, message: "", resolve: null });
  };

  const handleAlertClose = () => {
    if (alertState.resolve) {
      alertState.resolve(true);
    }
    setAlertState({ open: false, message: "", resolve: null });
  };

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);

  if (!ctx) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }

  return ctx.confirm;
};

export const useAlert = () => {
  const ctx = useContext(ConfirmContext);

  if (!ctx) {
    throw new Error("useAlert must be used within a ConfirmProvider");
  }

  return ctx.alert;
};
