// src/components/molecules/common/Pagination.jsx
// 사용 예시:
// const [currentPage, setCurrentPage] = useState(1);
// const itemsPerPage = 5;
// const totalPages = Math.ceil( / itemsPerPage);
// 페이지 자르는 함수
// const paginatedData = data.slice(
//   (currentPage - 1) * itemsPerPage,
//   currentPage * itemsPerPage);
// <Pagination
//   currentPage={currentPage}
//   setCurrentPage={setCurrentPage}
//   totalPages={totalPages}
// />
import paginationLeft from '../../../assets/icon/pagination_left.png'
import paginationRight from '../../../assets/icon/pagination_right.png'

const Pagination = ({ currentPage, setCurrentPage, totalPages = 5 }) => {
    const handleClick = (page) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    };
  
    return (
      <div className="flex items-center justify-center gap-1 my-4">
        {/* 왼쪽 화살표 */}
        <button
          aria-label="이전 페이지"
          onClick={() => handleClick(currentPage - 1)}
          className={`w-12 h-12 flex items-center justify-center ${
            currentPage === 1 ? 'opacity-30 cursor-not-allowed' : ''
          }`}
          disabled={currentPage === 1}
        >
          <img src={paginationLeft} alt="pagination left" className="w-6 h-8" />
        </button>
  
        {/* 페이지 번호 */}
        <div className="flex bg-white h-[55px] py-1 text-black text-xl">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              aria-label={`페이지 ${page}`}
              onClick={() => handleClick(page)}
              className={`
                w-12 h-12 flex items-center justify-center
                ${page === currentPage ? "font-bold scale-110" : "opacity-60"}
                transition-all text-3xl
              `}
            >
              {page}
            </button>
          ))}
        </div>
  
        {/* 오른쪽 화살표 */}
        <button
          aria-label="다음 페이지"
          onClick={() => handleClick(currentPage + 1)}
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