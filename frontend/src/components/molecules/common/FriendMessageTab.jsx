import TabButton from '../../atoms/button/TapButton'

const FriendMessageTab = ({ activeTab = 'friend', onTabChange }) => {
  const tabs = [
    { key: 'friend', label: '친구 목록' },
    { key: 'received', label: '받은 쪽지함' },
    { key: 'sent', label: '보낸 쪽지함' },
  ]

  return (
    <div className="flex gap-1 justify-center mb-3">
      {tabs.map((tab) => (
        <TabButton
          key={tab.key}
          label={tab.label}
          active={activeTab === tab.key}
          onClick={() => onTabChange(tab.key)}
        />
      ))}
    </div>
  )
}

export default FriendMessageTab
