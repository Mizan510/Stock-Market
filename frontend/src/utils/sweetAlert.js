import Swal from "sweetalert2";

export const showAlert = (message, icon = "info", title = "") => {
  return Swal.fire({
    title: title || "Notification",
    text: message,
    icon: icon,
    confirmButtonText: "OK",
    confirmButtonColor: "#3085d6",
    allowOutsideClick: false,
    allowEscapeKey: false,
    backdrop: "rgba(0,0,0,0.4)",
  });
};

export const showSuccessAlert = (message) => {
  return showAlert(message, "success", "Success");
};

export const showErrorAlert = (message) => {
  return showAlert(message, "error", "Error");
};

export const showWarningAlert = (message) => {
  return showAlert(message, "warning", "Warning");
};

export const showConfirm = (message, title = "Are you sure?") => {
  return Swal.fire({
    title: title,
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
};
