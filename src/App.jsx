import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { RotateCcw, Undo2, Trophy } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Configuration ---

// Valid squares based on user description:
// Col 0: Row 0
// Col 1: Row 0, 1, 2, 3
// Col 2: Row 0, 1, 2
// Col 3: Row 0, 1
const VALID_SQUARES = [
    { col: 0, row: 0 },
    { col: 1, row: 0 }, { col: 1, row: 1 }, { col: 1, row: 2 }, { col: 1, row: 3 },
    { col: 2, row: 0 }, { col: 2, row: 1 }, { col: 2, row: 2 },
    { col: 3, row: 0 }, { col: 3, row: 1 }
];

const INITIAL_PIECES = [
    { id: 'wk1', type: 'white', col: 1, row: 0 },
    { id: 'wk2', type: 'white', col: 2, row: 2 },
    { id: 'bk1', type: 'black', col: 0, row: 0 },
    { id: 'bk2', type: 'black', col: 2, row: 0 },
];

// Target positions (unordered)
const TARGET_WHITE = [{ col: 0, row: 0 }, { col: 2, row: 0 }];
const TARGET_BLACK = [{ col: 1, row: 0 }, { col: 2, row: 2 }];

// --- Components ---

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const KnightIcon = ({ type, className }) => (
    <svg
        viewBox="0 0 45 45"
        className={cn("w-full h-full drop-shadow-md", className)}
        fill={type === 'white' ? '#f0f0f0' : '#1a1a1a'}
        stroke={type === 'white' ? '#1a1a1a' : '#f0f0f0'}
        strokeWidth="1.5"
    >
        <g transform="translate(0,0)">
            <path d="M 22,10 C 32.5,11 38.5,25 38,30 L 38,30 C 38,30 35,32.5 28,32.5 C 28,32.5 28,18.5 28,18.5 C 28,18.5 27,18.5 27,18.5 C 27,18.5 27,32.5 27,32.5 C 27,32.5 19.5,32.5 19.5,32.5 C 19.5,32.5 19.5,18.5 19.5,18.5 C 19.5,18.5 18.5,18.5 18.5,18.5 C 18.5,18.5 18.5,32.5 18.5,32.5 C 18.5,32.5 11,32.5 11,32.5 L 11,30 C 10.5,25 16.5,11 27,10 z" style={{ opacity: 0 }} />
            {/* Standard Chess Knight Shape */}
            <path d="M 22,10 C 32.5,11 38.5,25 38,30 L 38,30 L 38,34 L 7,34 L 7,30 C 6.5,25 12.5,11 22,10 z" style={{ display: 'none' }} />
            <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 C 31,12 20,12 7,14 L 9,26 z" style={{ display: 'none' }} />
            {/* Better Knight Path */}
            <path d="M 22,9 C 19.79,9 18,10.79 18,13 C 18,13.88 18.26,14.68 18.72,15.37 C 18.86,15.58 19.04,15.77 19.24,15.93 C 19.55,16.17 19.9,16.37 20.28,16.49 C 20.81,16.66 21.39,16.75 22,16.75 C 24.07,16.75 25.75,15.07 25.75,13 C 25.75,10.93 24.07,9 22,9 z M 22,11.5 C 22.83,11.5 23.5,12.17 23.5,13 C 23.5,13.83 22.83,14.5 22,14.5 C 21.17,14.5 20.5,13.83 20.5,13 C 20.5,12.17 21.17,11.5 22,11.5 z M 16.5,17 C 15.67,17 15,17.67 15,18.5 C 15,18.86 15.13,19.18 15.34,19.44 C 15.11,19.73 14.78,20.08 14.38,20.47 C 12.61,22.21 10.5,23.5 10.5,23.5 L 10.5,26 C 10.5,26 13.33,24.29 15.5,22.16 C 16.54,21.14 17.38,20.08 18.06,19.09 C 18.47,19.35 18.96,19.5 19.5,19.5 C 21.16,19.5 22.5,18.16 22.5,16.5 C 22.5,16.29 22.47,16.08 22.42,15.89 C 23.55,15.35 24.81,15.06 26.13,15.06 C 30.5,15.06 34.5,17.5 34.5,17.5 L 34.5,20 C 34.5,20 30.5,17.56 26.13,17.56 C 25.17,17.56 24.23,17.71 23.34,18 C 23.44,18.47 23.5,18.97 23.5,19.5 C 23.5,22.81 20.81,25.5 17.5,25.5 C 16.97,25.5 16.46,25.44 15.97,25.33 C 15.71,25.88 15.34,26.41 14.88,26.88 C 13.11,28.62 11,29.91 11,29.91 L 11,32.41 C 11,32.41 13.83,30.7 16,28.57 C 17.04,27.55 17.88,26.49 18.56,25.5 C 18.97,25.76 19.46,25.91 20,25.91 C 21.66,25.91 23,24.57 23,22.91 C 23,22.7 22.97,22.49 22.92,22.3 C 24.05,21.76 25.31,21.47 26.63,21.47 C 31,21.47 35,23.91 35,23.91 L 35,26.41 C 35,26.41 31,23.97 26.63,23.97 C 25.67,23.97 24.73,24.12 23.84,24.41 C 23.94,24.88 24,25.38 24,25.91 C 24,29.22 21.31,31.91 18,31.91 C 17.47,31.91 16.96,31.85 16.47,31.74 C 16.21,32.29 15.84,32.82 15.38,33.29 C 13.61,35.03 11.5,36.32 11.5,36.32 L 11.5,38.82 C 11.5,38.82 14.33,37.11 16.5,34.98 C 17.54,33.96 18.38,32.9 19.06,31.91 C 19.47,32.17 19.96,32.32 20.5,32.32 C 22.16,32.32 23.5,30.98 23.5,29.32 C 23.5,29.11 23.47,28.9 23.42,28.71 C 24.55,28.17 25.81,27.88 27.13,27.88 C 31.5,27.88 35.5,30.32 35.5,30.32 L 35.5,32.82 C 35.5,32.82 31.5,30.38 27.13,30.38 C 26.17,30.38 25.23,30.53 24.34,30.82 C 24.44,31.29 24.5,31.79 24.5,32.32 C 24.5,35.63 21.81,38.32 18.5,38.32 C 15.19,38.32 12.5,35.63 12.5,32.32 C 12.5,31.79 12.56,31.29 12.66,30.82 C 11.77,30.53 10.83,30.38 9.87,30.38 C 5.5,30.38 1.5,32.82 1.5,32.82 L 1.5,30.32 C 1.5,30.32 5.5,27.88 9.87,27.88 C 11.19,27.88 12.45,28.17 13.58,28.71 C 13.53,28.9 13.5,29.11 13.5,29.32 C 13.5,30.98 14.84,32.32 16.5,32.32 C 17.04,32.32 17.53,32.17 17.94,31.91 C 18.62,32.9 19.46,33.96 20.5,34.98 C 22.67,37.11 25.5,38.82 25.5,38.82 L 25.5,36.32 C 25.5,36.32 23.39,35.03 21.62,33.29 C 21.16,32.82 20.79,32.29 20.53,31.74 C 20.04,31.85 19.53,31.91 19,31.91 C 15.69,31.91 13,29.22 13,25.91 C 13,25.38 13.06,24.88 13.16,24.41 C 12.27,24.12 11.33,23.97 10.37,23.97 C 6,23.97 2,26.41 2,26.41 L 2,23.91 C 2,23.91 6,21.47 10.37,21.47 C 11.69,21.47 12.95,21.76 14.08,22.3 C 14.03,22.49 14,22.7 14,22.91 C 14,24.57 15.34,25.91 17,25.91 C 17.54,25.91 18.03,25.76 18.44,25.5 C 19.12,26.49 19.96,27.55 21,28.57 C 23.17,30.7 26,32.41 26,32.41 L 26,29.91 C 26,29.91 23.89,28.62 22.12,26.88 C 21.66,26.41 21.29,25.88 21.03,25.33 C 20.54,25.44 20.03,25.5 19.5,25.5 C 16.19,25.5 13.5,22.81 13.5,19.5 C 13.5,18.97 13.56,18.47 13.66,18 C 12.77,17.71 11.83,17.56 10.87,17.56 C 6.5,17.56 2.5,20 2.5,20 L 2.5,17.5 C 2.5,17.5 6.5,15.06 10.87,15.06 C 12.19,15.06 13.45,15.35 14.58,15.89 C 14.53,16.08 14.5,16.29 14.5,16.5 C 14.5,18.16 15.84,19.5 17.5,19.5 C 18.04,19.5 18.53,19.35 18.94,19.09 C 19.62,20.08 20.46,21.14 21.5,22.16 C 23.67,24.29 26.5,26 26.5,26 L 26.5,23.5 C 26.5,23.5 24.39,22.21 22.62,20.47 C 22.22,20.08 21.89,19.73 21.66,19.44 C 21.87,19.18 22,18.86 22,18.5 C 22,17.67 21.33,17 20.5,17 z" />
            {/* Simple Knight */}
            <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 C 31,12 20,12 7,14 L 9,26 z" />
            <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" />
            <path d="M 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 L 34,40 C 27.5,41 17.5,41 11,40 L 11,38.5 z" />
            <path d="M 11,29 C 11,29 14,29.5 15,30 C 15,30 15.5,30.5 15.5,31 C 15.5,31.5 15,32 15,32 C 15,32 14,32 14,32 C 14,32 13.5,32.5 13.5,33 C 13.5,33.5 14,34 14,34 C 14,34 16,34.5 17,34.5 C 17,34.5 18,34.5 18,34 C 18,33.5 17.5,33 17.5,33 C 17.5,33 17,32.5 17,32 C 17,31.5 17.5,31 17.5,31 C 17.5,31 18.5,31 18.5,31 C 18.5,31 19.5,30.5 19.5,30 C 19.5,29.5 18.5,29 18.5,29 C 18.5,29 11,29 11,29 z" />
        </g>
    </svg>
);

export default function App() {
    const [pieces, setPieces] = useState(INITIAL_PIECES);
    const [history, setHistory] = useState([]);
    const [moveCount, setMoveCount] = useState(0);
    const [selectedPieceId, setSelectedPieceId] = useState(null);
    const [solved, setSolved] = useState(false);

    // Check win condition
    useEffect(() => {
        const isSolved = checkWinCondition(pieces);
        if (isSolved && !solved) {
            setSolved(true);
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
        } else if (!isSolved && solved) {
            setSolved(false);
        }
    }, [pieces, solved]);

    const checkWinCondition = (currentPieces) => {
        const whites = currentPieces.filter(p => p.type === 'white');
        const blacks = currentPieces.filter(p => p.type === 'black');

        const whitesCorrect = TARGET_WHITE.every(target =>
            whites.some(p => p.col === target.col && p.row === target.row)
        );
        const blacksCorrect = TARGET_BLACK.every(target =>
            blacks.some(p => p.col === target.col && p.row === target.row)
        );

        return whitesCorrect && blacksCorrect;
    };

    const getValidMoves = (piece) => {
        if (!piece) return [];
        const moves = [
            { col: piece.col + 1, row: piece.row + 2 },
            { col: piece.col + 1, row: piece.row - 2 },
            { col: piece.col - 1, row: piece.row + 2 },
            { col: piece.col - 1, row: piece.row - 2 },
            { col: piece.col + 2, row: piece.row + 1 },
            { col: piece.col + 2, row: piece.row - 1 },
            { col: piece.col - 2, row: piece.row + 1 },
            { col: piece.col - 2, row: piece.row - 1 },
        ];

        return moves.filter(move => {
            // Check if move is within valid squares
            const isValidSquare = VALID_SQUARES.some(sq => sq.col === move.col && sq.row === move.row);
            if (!isValidSquare) return false;

            // Check if square is occupied
            const isOccupied = pieces.some(p => p.col === move.col && p.row === move.row);
            return !isOccupied;
        });
    };

    const handleSquareClick = (col, row) => {
        if (solved) return;

        // Check if clicked on a piece
        const clickedPiece = pieces.find(p => p.col === col && p.row === row);

        if (clickedPiece) {
            setSelectedPieceId(clickedPiece.id);
        } else if (selectedPieceId) {
            // Try to move selected piece
            const piece = pieces.find(p => p.id === selectedPieceId);
            const validMoves = getValidMoves(piece);
            const isMoveValid = validMoves.some(m => m.col === col && m.row === row);

            if (isMoveValid) {
                // Save history
                setHistory(prev => [...prev, pieces]);

                // Update pieces
                setPieces(prev => prev.map(p =>
                    p.id === selectedPieceId ? { ...p, col, row } : p
                ));

                setMoveCount(c => c + 1);
                setSelectedPieceId(null);
            } else {
                // Deselect if clicking invalid empty square
                setSelectedPieceId(null);
            }
        }
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const previousState = history[history.length - 1];
        setPieces(previousState);
        setHistory(prev => prev.slice(0, -1));
        setMoveCount(c => c - 1);
        setSolved(false);
        setSelectedPieceId(null);
    };

    const handleReset = () => {
        setPieces(INITIAL_PIECES);
        setHistory([]);
        setMoveCount(0);
        setSolved(false);
        setSelectedPieceId(null);
    };

    // Render grid
    // Rows 3 down to 0
    const rows = [3, 2, 1, 0];
    const cols = [0, 1, 2, 3];

    const selectedPiece = pieces.find(p => p.id === selectedPieceId);
    const validDestinations = selectedPiece ? getValidMoves(selectedPiece) : [];

    return (
        <div className="min-h-screen bg-[#262421] text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full flex flex-col md:flex-row gap-8 items-center justify-center">

                {/* Sidebar / Controls */}
                <div className="flex flex-col gap-6 w-full md:w-64 order-2 md:order-1">
                    <div className="bg-[#302e2b] p-6 rounded-lg shadow-lg border border-[#403d39]">
                        <h1 className="text-2xl font-bold mb-4 text-[#f0d9b5]">Knight Swap</h1>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-400">Moves</span>
                            <span className="text-3xl font-mono font-bold text-white">{moveCount}</span>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleUndo}
                                disabled={history.length === 0}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#403d39] hover:bg-[#504d49] disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded transition-colors"
                            >
                                <Undo2 size={18} /> Undo
                            </button>
                            <button
                                onClick={handleReset}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#403d39] hover:bg-[#504d49] py-2 rounded transition-colors"
                            >
                                <RotateCcw size={18} /> Reset
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#302e2b] p-6 rounded-lg shadow-lg border border-[#403d39]">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Goal</h2>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            Swap the positions of the White and Black Knights.
                        </p>
                        <div className="mt-4 flex gap-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#f0d9b5]"></div> White</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#1a1a1a] border border-gray-600"></div> Black</div>
                        </div>
                    </div>
                </div>

                {/* Game Board */}
                <div className="relative order-1 md:order-2">
                    <div className="bg-[#302e2b] p-4 rounded-xl shadow-2xl border border-[#403d39]">
                        <div className="grid grid-cols-4 gap-0 bg-transparent relative" style={{ width: '320px', height: '320px' }}>
                            {rows.map(row => (
                                cols.map(col => {
                                    const isValid = VALID_SQUARES.some(s => s.col === col && s.row === row);
                                    const isDark = (col + row) % 2 === 1; // Chess board pattern
                                    const piece = pieces.find(p => p.col === col && p.row === row);
                                    const isSelected = selectedPieceId === piece?.id;
                                    const isDest = validDestinations.some(d => d.col === col && d.row === row);

                                    if (!isValid) {
                                        return <div key={`${col}-${row}`} className="w-20 h-20 bg-transparent" />;
                                    }

                                    return (
                                        <div
                                            key={`${col}-${row}`}
                                            onClick={() => handleSquareClick(col, row)}
                                            className={cn(
                                                "w-20 h-20 relative flex items-center justify-center cursor-pointer transition-colors duration-200",
                                                isDark ? "bg-[#769656]" : "bg-[#eeeed2]",
                                                isSelected && "ring-inset ring-4 ring-yellow-400",
                                                isDest && "after:content-[''] after:absolute after:w-4 after:h-4 after:bg-black/20 after:rounded-full"
                                            )}
                                        >
                                            {/* Coordinate label for debugging (optional, can remove) */}
                                            {/* <span className="absolute bottom-0.5 right-0.5 text-[8px] text-black/30 font-mono">{col},{row}</span> */}

                                            <AnimatePresence>
                                                {piece && (
                                                    <motion.div
                                                        layoutId={piece.id}
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0.8, opacity: 0 }}
                                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                        className="w-16 h-16"
                                                    >
                                                        <KnightIcon type={piece.type} />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            <AnimatePresence>
                {solved && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    >
                        <div className="bg-[#302e2b] p-8 rounded-2xl shadow-2xl border border-[#403d39] text-center max-w-sm mx-4">
                            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trophy className="w-8 h-8 text-yellow-500" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Puzzle Solved!</h2>
                            <p className="text-gray-400 mb-6">
                                You completed the Knight Swap in <span className="text-[#f0d9b5] font-bold">{moveCount}</span> moves.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 bg-[#769656] hover:bg-[#6a884d] text-white font-bold py-3 rounded-lg transition-colors"
                                >
                                    Play Again
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
