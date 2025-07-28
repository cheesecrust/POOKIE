// src/components/molecules/home/GameTab.jsx
// 사용 예시:
// const [activeTab, setActiveTab] = useState('all');
// const handleTabChange = (tabKey) => setActiveTab(tabKey);
// <GameTab
//   activeTab={activeTab}
//   onChange={handleTabChange}
// />
import TabButton from '../../atoms/button/TapButton'

const GameTab = ({ activeTab = 'all', onChange }) => {
    const tabs = [
        { key: 'all', label: '전체' },
        { key: 'waiting', label: '대기중' },
        { key: 'samepose', label: '일심동체' },
        { key: 'sketchrelay', label: '이어 그리기' },
        { key: 'silentscream', label: '고요 속의 외침' },
    ];

    return (
        <div className="flex justify-center gap-15 my-4">
          {tabs.map((tab, index) => (
            <TabButton
              key={tab.key}
                label={tab.label}
                active={activeTab === tab.key}
                onClick={() => onChange(tab.key)}
                className={`bg-[${index === 0 ? '#F4C0C0' : '#EF8888'}]`}
                />
            ))}
        </div>
    );
};

export default GameTab;