// src/components/atoms/radio/Radio.jsx
// 사용 예시:
// useState import 필수
// const [checked, setChecked] = useState(false);
// <Radio
//   checked={checked}
//   onChange={() => setChecked(!checked)}
// />

const Radio = ({ checked, onChange }) => {
    return (
        <button
          type="button"
          onClick={onChange}
          className={`w-[50px] h-[38px] rounded-full shadow-md flex items-center justify-center transition bg-[#E2FFFE]`}
        >
          <span className={`text-2xl ${checked ? "text-black" : "text-transparent"}`}>
            ✔️
          </span>
        </button>
      );
    };

export default Radio;