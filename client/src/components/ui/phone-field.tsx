import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface PhoneFieldProps {
  /** E.164-ish value, e.g. "+970590000000". */
  value: string;
  onChange: (value: string) => void;
  /** Default selected country (ISO2). */
  country?: string;
  placeholder?: string;
}

/**
 * Country-aware phone input. Forces a country code (defaults to Palestine),
 * stores the value with a leading "+". The dial UI stays LTR by design even
 * inside an RTL form, since phone numbers read left-to-right.
 */
export function PhoneField({
  value,
  onChange,
  country = 'ps',
  placeholder,
}: PhoneFieldProps) {
  return (
    <div dir="ltr">
      <PhoneInput
        country={country}
        value={value.startsWith('+') ? value.slice(1) : value}
        onChange={(v) => onChange('+' + v)}
        placeholder={placeholder}
        inputProps={{ name: 'phone' }}
        containerClass="!w-full"
        inputClass="!w-full !h-10 !rounded-md !bg-background !text-foreground !border !border-input !ps-14 !pe-3 !text-sm !shadow-sm focus:!ring-2 focus:!ring-ring"
        buttonClass="!bg-background !border-input !rounded-s-md"
        dropdownClass="!bg-popover !text-popover-foreground !border !border-border !rounded-md"
        searchClass="!bg-background !text-foreground"
      />
    </div>
  );
}
