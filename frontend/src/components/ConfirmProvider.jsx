import React, { createContext, useCallback, useContext, useState } from "react";

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: "",
    resolve: null,
  });

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmState({ open: true, message, resolve });
    });
  }, []);

  const handleAnswer = (answer) => {
    if (confirmState.resolve) {
      confirmState.resolve(answer);
    }
    setConfirmState({ open: false, message: "", resolve: null });
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {confirmState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
            <p className="text-lg font-semibold text-gray-900">
              {confirmState.message}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => handleAnswer(true)}
                className="inline-flex w-full justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleAnswer(false)}
                className="inline-flex w-full justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const confirm = useContext(ConfirmContext);

  if (!confirm) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }

  return confirm;
};
