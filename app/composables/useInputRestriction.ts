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

  // New function to restrict input to max page number
  const allowOnlyNumbersWithMax = (maxPage: number) => {
    return (event: KeyboardEvent) => {
      const charCode = event.charCode || event.keyCode;
      
      // First check if it's a number
      if (charCode < 48 || charCode > 57) {
        event.preventDefault();
        return;
      }

      // Check if the resulting value would exceed maxPage
      const target = event.target as HTMLInputElement;
      const currentValue = target.value;
      const newChar = String.fromCharCode(charCode);
      const newValue = currentValue + newChar;

      if (parseInt(newValue) > maxPage) {
        event.preventDefault();
      }
    };
  };

  // Enhanced paste handler with max validation
  const numbersOnlyOnPasteWithMax = (maxPage: number) => {
    return (event: ClipboardEvent) => {
      const pasted = event.clipboardData?.getData("text") ?? "";
      
      if (!/^[0-9]+$/.test(pasted)) {
        event.preventDefault();
        return;
      }

      if (parseInt(pasted) > maxPage) {
        event.preventDefault();
      }
    };
  };

  // Input handler to validate on change (catches all scenarios)
  const validateMaxPage = (maxPage: number) => {
    return (event: Event) => {
      const target = event.target as HTMLInputElement;
      const value = parseInt(target.value);
      
      if (value > maxPage) {
        target.value = maxPage.toString();
      } else if (value < 1 && target.value !== '') {
        target.value = '1';
      }
    };
  };

  // Paste in Script Setup
  // const { allowOnlyNumbers, numbersOnlyOnPaste } = await useInputRestriction();

  // Use in Input
  // @keypress="allowOnlyNumbers"
  // @paste="numbersOnlyOnPaste"

  return {
    allowOnlyNumbers,
    numbersOnlyOnPaste,
    allowOnlyNumbersWithMax,
    numbersOnlyOnPasteWithMax,
    validateMaxPage,
  };
}
