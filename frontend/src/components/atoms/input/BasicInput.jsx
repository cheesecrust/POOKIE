// src/components/atoms/input/BasicInput.jsx
// 사용 예시:
// useState import 필수
// 아래 함수 선언 필수
// const handleKeyDown = (e) => {
//   if (e.key === "Enter") {
//     console.log("엔터 입력됨!", text);
//     setText("");
//   }
// }
// <BasicInput
//   value={text}
//   onChange={(e) => setText(e.target.value)}
//   onKeyDown={handleKeyDown}
//   placeholder="내용을 입력하세요"
//   className=""   
// />

const BasicInput = ({
    value,
    onChange,
    onKeyDown,
    placeholder,
    className = "",
    type = "text",
 }) => {
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className={`rounded border-2 border-black shadow-md outline-none px-2 text-lg text-black bg-white
                ${className || "w-[350px] h-[50px]"}
            `}
        />
    )
}

export default BasicInput