import { useApi } from "@/composables/useApi";

export function useInputRestriction() {
  // You only need this if you actually use API calls here
  const api = useApi();

  const allowOnlyNumbers = (event: KeyboardEvent) => {
    const charCode = event.charCode || event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  };

  const numbersOnlyOnPaste = (event: ClipboardEvent) => {
    const pasted = event.clipboardData?.getData("text") ?? "";
    if (!/^[0-9]+$/.test(pasted)) {
      event.preventDefault();
    }
  };

  // Paste in Script Setup
  // const { allowOnlyNumbers, numbersOnlyOnPaste } = await useInputRestriction();

  // Use in Input
  // @keypress="allowOnlyNumbers"
  // @paste="numbersOnlyOnPaste"

  return {
    allowOnlyNumbers,
    numbersOnlyOnPaste,
  };
}
