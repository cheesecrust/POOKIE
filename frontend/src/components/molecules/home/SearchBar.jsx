// src/components/molecules/home/SearchBar.jsx
// 사용 예시:
// 검색 함수 필수 정의
// const handleSearch = (keyword) => {
//     console.log("검색어:", keyword);
// };
// 필터링 또는 API 호출 검색 로직 -> 백 문의
// <SearchBar
//   onSearch={handleSearch}
// />
import BasicInput from '../../atoms/input/BasicInput'
import ModalButton from '../../atoms/button/ModalButton'
import { useState } from 'react'

const SearchBar = ({ onSearch, className="" }) => {
    const [searchText, setSearchText] = useState("");

    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        onSearch(searchText);
      }
    }
    return (
      <div className={`flex items-center gap-4 my-4 ${className}`}>
        <BasicInput
          placeholder="방의 제목을 입력하세요"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-100 h-12 rounded-full text-center placeholder:text-center"
        />
        <ModalButton
            onClick={() => onSearch(searchText)}
            className="h-12"
        >
            검색
        </ModalButton>
      </div>
    );
};

export default SearchBar;
