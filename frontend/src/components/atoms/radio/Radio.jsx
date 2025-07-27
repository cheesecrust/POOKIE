// src/components/atoms/radio/Radio.jsx
// 사용 예시:
// 1. 단일 토글용 (Boolean Toggle)
// const [checked, setChecked] = useState(false);
// <Radio
//   checked={checked}
//   onChange={setChecked}
// />

// 2. 라디오 그룹 선택용 (Radio Group)
// const [selected, setSelected] = useState("");
// <Radio
//   value="samepose"
//   selectedValue={selected}
//   onChange={setSelected}
// />

// 3. 비활성화 상태 (disabled)
// <Radio
//   checked={false}
//   onChange={() => {}}
//   disabled={true}
// />

const Radio = ({
  value,
  selectedValue,
  checked,
  onChange,
  className = "",
  disabled = false,
}) => {
  const isChecked =
    selectedValue !== undefined && value !== undefined
      ? selectedValue === value
      : checked;

  const handleChange = () => {
    if (disabled) return;
    if (selectedValue !== undefined && value !== undefined) {
      onChange(value); // 라디오 그룹
    } else {
      onChange(!checked); // Boolean toggle
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleChange}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-full shadow-md transition
        ${isChecked ? "bg-[#C5CBF8]" : "bg-[#E2FFFE]"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#C5CBF8]"}
        ${className}
      `}
    >
      <span className={`text-2xl ${isChecked ? "text-black" : "text-transparent"}`}>
        ✔️
      </span>
    </button>
  );
};

export default Radio;