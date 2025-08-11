// components/organisms/waiting/InformationTabs.jsx

import PropTypes from "prop-types";
import TabButton from "../../atoms/button/TapButton";

export default function InformationTabs({
  activeTab = "silentscream",
  onChange,
}) {
  const tabs = [
    { key: "silentscream", label: "고요 속의 외침" },
    { key: "sketchrelay", label: "그림이어그리기" },
    { key: "samepose", label: "일심동체" },
  ];
  return (
    <div className="w-full flex justify-start">
      {tabs.map((t) => (
        <TabButton
          key={t.key}
          label={t.label}
          active={activeTab === t.key}
          onClick={() => onChange?.(t.key)}
        />
      ))}
    </div>
  );
}

InformationTabs.propTypes = {
  activeTab: PropTypes.string,
  onChange: PropTypes.func,
};
