import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import SudokuGame from "./components/sudoku/SudokuGame";
import "./index.css";
import { useEffect } from "react";

function App() {
  // 스크롤 관련 설정 추가
  useEffect(() => {
    // 처음 로드 시 페이지 상단으로 스크롤
    window.scrollTo(0, 0);
    
    // 스크롤 관련 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      html, body {
        overscroll-behavior: none;
        height: 100%;
        overflow-x: hidden;
      }
      
      @media (max-height: 750px) {
        html, body {
          overflow-y: auto;
          height: auto;
        }
      }
    `;
    document.head.appendChild(style);
    
    // 클린업 함수
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen w-full flex items-center justify-center bg-background py-4 px-2 overflow-y-auto">
        <SudokuGame />
      </div>
    </QueryClientProvider>
  );
}

export default App;
