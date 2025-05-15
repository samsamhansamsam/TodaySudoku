import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'ko' | 'en';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

// 한국어 번역 
const koStrings: Record<string, string> = {
  // 난이도
  'easy': '쉬움',
  'medium': '보통',
  'hard': '어려움',
  
  // 메인 화면
  'Sudoku Puzzle': '스도쿠 퍼즐',
  'Welcome to Sudoku!': '스도쿠에 오신 것을 환영합니다!',
  'Select a difficulty and start a new game': '난이도를 선택하고 새 게임을 시작하세요',
  'Select Difficulty': '난이도 선택',
  'Difficulty info': '난이도 정보',
  'Start New Game': '새 게임 시작',
  'Choose difficulty and press Start to begin!': '난이도를 선택하고 시작 버튼을 누르세요!',
  'Practice Mode (scores will not be saved)': '연습 모드 (점수가 저장되지 않습니다)',
  
  // 난이도 설명
  'Easy': '쉬움',
  'Medium': '보통',
  'Hard': '어려움',
  'For beginners, straightforward solving techniques.': '초보자를 위한 간단한 풀이 기술',
  'Requires more deduction and moderate techniques.': '더 많은 추론과 중급 기술이 필요합니다',
  'Challenging puzzles requiring advanced techniques.': '고급 기술이 필요한 도전적인 퍼즐',
  'All puzzles have a unique solution that can be solved logically.': '모든 퍼즐은 논리적으로 풀 수 있는 하나의 고유한 솔루션을 가지고 있습니다.',
  'cells filled': '칸이 채워져 있음',
  
  // 게임 중
  'Check': '확인',
  'Reset': '초기화',
  'Note Mode': '메모 모드',
  'Notes': '메모',
  'Clear': '지우기',
  
  // 게임 종료
  'Congratulations!': '축하합니다!',
  'You have completed the puzzle.': '퍼즐을 완성했습니다.',
  'Your time': '소요 시간',
  'Add to Leaderboard': '리더보드에 추가하기',
  'You\'ve completed the': '다음 난이도를 완료했습니다:',
  'puzzle in': '완료 시간:',
  'Enter your nickname to save your score to the leaderboard.': '닉네임을 입력하여 리더보드에 점수를 저장하세요.',
  'Nickname': '닉네임',
  'Enter your nickname': '닉네임을 입력하세요',
  'Please enter a nickname.': '닉네임을 입력해주세요.',
  'Submit': '제출',
  'Skip': '건너뛰기',
  
  // 리더보드
  'Leaderboard': '리더보드',
  'Today\'s Top Scores': '오늘의 최고 점수',
  'View Today\'s Scores': '오늘의 점수 보기',
  'View Historical Scores': '과거 점수 보기',
  'Select Date': '날짜 선택',
  'Rank': '순위',
  'Player': '플레이어',
  'Time': '시간',
  'No scores yet': '아직 점수가 없습니다',
  'Be the first to complete this puzzle!': '첫 번째로 이 퍼즐을 완료해보세요!',
  'No scores for this date and difficulty.': '해당 날짜와 난이도에 대한 점수가 없습니다.',
  
  // 에러 메시지
  'An error occurred while saving your score. Please try again.': '점수 저장 중 오류가 발생했습니다. 다시 시도해주세요.',
  'You have already submitted a score for this difficulty level today.': '오늘 이 난이도에 대한 점수를 이미 제출했습니다.',
  'Duplicate submission': '중복 제출',
  
  // 연습 모드
  'Practice mode completed!': '연습 모드가 완료되었습니다!',
  'You\'ve already completed today\'s': '오늘의 다음 난이도는 이미 완료했습니다:',
  'Would you like to play it again in practice mode?': '연습 모드로 다시 플레이하시겠습니까?',
  '(리더보드 등록은 불가능합니다)': '(리더보드 등록은 불가능합니다)',
  
  // 언어 선택
  'Language': '언어',
  'Korean': '한국어',
  'English': '영어',
};

export const useLanguage = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'ko', // Default to Korean
      setLanguage: (language: Language) => set({ language }),
      t: (key: string) => {
        const { language } = get();
        if (language === 'ko' && key in koStrings) {
          return koStrings[key];
        }
        return key; // 번역이 없거나 영어를 선택한 경우 원래 키 반환
      }
    }),
    {
      name: 'language-storage', // name of the localStorage item
    }
  )
);