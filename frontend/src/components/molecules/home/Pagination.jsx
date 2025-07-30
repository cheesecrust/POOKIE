// src/components/molecules/common/Pagination.jsx
// 사용 예시:
// 함수 선언 필수
// const [currentPage, setCurrentPage] = useState(1);
// const itemsPerPage = 5;
// const totalPages = Math.ceil(roomList.length / itemsPerPage);
// <Pagination
//   currentPage={currentPage}
//   setCurrentPage={setCurrentPage}
//   totalPages={totalPages}
// />
// 추가로 선언 -> 페이징 처리 후 데이터 추출
// const paginatedRooms = roomList.slice(
//   (currentPage - 1) * itemsPerPage,
//   currentPage * itemsPerPage);
import paginationLeft from '../../../assets/icon/pagination_left.png'
import paginationRight from '../../../assets/icon/pagination_right.png'
import { useState, useEffect } from 'react'

const Pagination = ({ currentPage, setCurrentPage, totalPages = 1, className="" }) => {
  const pagesPerGroup = 5
  const maxPage = Math.ceil(totalPages / pagesPerGroup) * pagesPerGroup // 항상 5의 배수로 그룹 생성성
  const [currentGroup, setCurrentGroup] = useState(1)

  useEffect(() => {
    const group = Math.ceil((currentPage+1) / pagesPerGroup)
    setCurrentGroup(group)
  }, [currentPage])

  // 페이지 넘버를 눌렀을 때 동작하는 함수
  const handlePageClick = (page) => {
    if (page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // 토글 버튼 클릭 시, 그룹 슬라이딩 함수
  const handleButtonClick = (direction) => {
    const nextPage = currentPage + direction

    // 조건 체크
    const isRightTrigger = direction === 1 && currentPage % pagesPerGroup === 0 && currentPage < totalPages
    const isLeftTrigger = direction === -1 && currentPage % pagesPerGroup === 1 && currentPage > 1

    if ((isRightTrigger || isLeftTrigger) && nextPage >= 1 && nextPage <= totalPages) {
      setCurrentPage(nextPage)
    }
  }

  const getGroupPages = () => {
    const start = (currentGroup -1) * pagesPerGroup + 1
    const end = start + pagesPerGroup - 1
    return Array.from({ length: pagesPerGroup }, (_, i) => start + i)
  }
  
    return (
      <div className={`flex items-center justify-center gap-1 my-4 ${className}`}>
        {/* 왼쪽 화살표 */}
        <button
          aria-label="이전 페이지"
          onClick={() => handleButtonClick(-1)}
          className={`w-12 h-12 flex items-center justify-center ${
            currentPage === 1 ? 'opacity-30 cursor-not-allowed' : ''
          }`}
          disabled={currentPage === 1}
        >
          <img src={paginationLeft} alt="pagination left" className="w-6 h-8" />
        </button>
  
        {/* 페이지 번호 */}
        <div className="flex bg-white h-[55px] py-1 text-black text-xl transition-all duration-300 ease-in-out">
        {getGroupPages().map((page) => {
          const isDisabled = page > totalPages
          const isActive = page === currentPage

          return (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              disabled={isDisabled}
              className={`
                w-12 h-12 flex items-center justify-center
                ${isActive ? 'font-bold scale-110' : 'opacity-60'}
                ${isDisabled ? 'opacity-20 cursor-not-allowed' : ''}
                transition-all text-3xl
              `}
            >
              {page}
            </button>
          )
        })}
      </div>
  
        {/* 오른쪽 화살표 */}
        <button
          aria-label="다음 페이지"
          onClick={() => handleButtonClick(1)}
          className={`w-12 h-12 flex items-center justify-center ${
            currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : ''
          }`}
          disabled={currentPage === totalPages}
        >
          <img src={paginationRight} alt="pagination right" className="w-6 h-8" />
        </button>
      </div>
    );
  };
  
  export default Pagination;  