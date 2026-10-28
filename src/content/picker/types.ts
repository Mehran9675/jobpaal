export interface PickerOptions {
  /** 'any' = any element (job fields), 'field' = form controls, 'upload' = file inputs / drop zones. */
  filter: 'any' | 'field' | 'upload';
  hint: string;
  onPick: (el: Element) => void;
  onCancel: () => void;
  /** Elements to ignore (e.g. the overlay host). */
  ignore?: Element[];
}
