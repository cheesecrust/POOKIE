// src/components/atoms/modal/InputBubble.jsx
import Bubble from "../../../assets/icon/inputBubble.png"

const InputBubble = ({ text }) => {
    return (
      <div
        className="w-80 h-40 bg-no-repeat bg-contain bg-center"
        style={{ backgroundImage: `url(${Bubble})` }}
      >
        <p className="text-center text-black pt-12 px-8 text-2xl truncate">
          {text}
        </p>
      </div>
    );
};

export default InputBubble