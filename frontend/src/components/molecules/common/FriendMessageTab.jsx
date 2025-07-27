import TabButton from '../../atoms/button/TapButton'

const FriendMessageTab = ({ activeTab = 'friend', onTabChange }) => {
  const tabs = [
    { key: 'friend', label: '친구 목록' },
    { key: 'received', label: '받은 쪽지함' },
    { key: 'sent', label: '보낸 쪽지함' },
  ]

  return (
    <div className="flex bg-transparent gap-2">
      {tabs.map((tab) => (
        <TabButton
          key={tab.key}
          label={tab.label}
          active={activeTab === tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`
            rounded-t-xl 
            w-[160px] h-[40px] text-base font-bold
            ${activeTab === tab.key ? 'bg-[#EF8888]  text-black' : 'bg-[#F4C0C0] text-gray-500 hover:bg-[#EF8888]'}
          `}
        />
      ))}
    </div>
  )
}

export default FriendMessageTab
