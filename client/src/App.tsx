import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import SudokuGame from "./components/sudoku/SudokuGame";
import "./index.css";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <SudokuGame />
      </div>
    </QueryClientProvider>
  );
}

export default App;
