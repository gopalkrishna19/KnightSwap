import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { RotateCcw, Undo2, Trophy, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import whiteKnight from './assets/white-knight.svg';
import blackKnight from './assets/black-knight.svg';

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
    { id: 'wk1', type: 'white', col: 1, row: 3 }, // b4
    { id: 'wk2', type: 'white', col: 2, row: 1 }, // c2
    { id: 'bk1', type: 'black', col: 0, row: 0 },
    { id: 'bk2', type: 'black', col: 2, row: 0 },
];

// Target positions (unordered)
const TARGET_WHITE = [{ col: 0, row: 0 }, { col: 2, row: 0 }];
const TARGET_BLACK = [{ col: 1, row: 3 }, { col: 2, row: 1 }];

// --- Components ---

function cn(...inputs) {
    return twMerge(clsx(inputs));
}



const KnightIcon = ({ type, className }) => (
    <img
        src={type === 'white' ? whiteKnight : blackKnight}
        alt={`${type} knight`}
        className={cn("w-full h-full drop-shadow-md select-none pointer-events-none", className)}
    />
);

const TargetBoard = () => {
    // Target positions:
    // White: (0,0), (2,0)
    // Black: (1,3), (2,1)
    const targetPieces = [
        { id: 'tw1', type: 'white', col: 0, row: 0 },
        { id: 'tw2', type: 'white', col: 2, row: 0 },
        { id: 'tb1', type: 'black', col: 1, row: 3 },
        { id: 'tb2', type: 'black', col: 2, row: 1 },
    ];

    const rows = [3, 2, 1, 0];
    const cols = [0, 1, 2, 3];

    return (
        <div className="grid grid-cols-4 gap-0 bg-transparent relative" style={{ width: '200px', height: '200px' }}>
            {rows.map(row => (
                cols.map(col => {
                    const isValid = VALID_SQUARES.some(s => s.col === col && s.row === row);
                    const isDark = (col + row) % 2 === 1;
                    const piece = targetPieces.find(p => p.col === col && p.row === row);

                    if (!isValid) {
                        return <div key={`t-${col}-${row}`} className="w-[50px] h-[50px] bg-transparent" />;
                    }

                    return (
                        <div
                            key={`t-${col}-${row}`}
                            className={cn(
                                "w-[50px] h-[50px] relative flex items-center justify-center",
                                isDark ? "bg-[#769656]" : "bg-[#eeeed2]"
                            )}
                        >
                            {piece && (
                                <div className="w-10 h-10">
                                    <KnightIcon type={piece.type} />
                                </div>
                            )}
                        </div>
                    );
                })
            ))}
        </div>
    );
};

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
            <div className="max-w-[1800px] w-full flex flex-col xl:flex-row gap-12 items-center justify-center">

                {/* Sidebar / Controls */}
                <div className="flex flex-col gap-6 w-full max-w-md shrink-0 order-2 xl:order-1">
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
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Instruction</h2>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            There are 2 white knights and 2 black knights shown in the modified chessboard above image. Your goal is to swap the positions of the white and black knights. Each knight moves as in a regular game of chess, and two knights cannot occupy the same square. But unlike chess, you do not have to alternate moves between white and black pieces. You can even move the same piece in consecutive moves.
                        </p>
                        <div className="mt-4 flex gap-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#f0d9b5]"></div> White</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#1a1a1a] border border-gray-600"></div> Black</div>
                        </div>
                    </div>
                </div>

                {/* Game Area: Board -> Arrow -> Target */}
                <div className="flex flex-col md:flex-row items-center gap-8 order-1 xl:order-2">
                    {/* Main Board */}
                    <div className="bg-[#302e2b] p-8 rounded-xl shadow-2xl border border-[#403d39]">
                        <h2 className="text-3xl font-bold text-[#f0d9b5] mb-6 text-center uppercase tracking-wider">Move Here</h2>
                        <div className="grid grid-cols-4 gap-0 bg-transparent relative" style={{ width: '640px', height: '640px' }}>
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
                                                "w-40 h-40 relative flex items-center justify-center cursor-pointer transition-colors duration-200",
                                                isDark ? "bg-[#769656]" : "bg-[#eeeed2]",
                                                isSelected && "ring-inset ring-4 ring-yellow-400",
                                                isDest && "after:content-[''] after:absolute after:w-4 after:h-4 after:bg-black/20 after:rounded-full"
                                            )}
                                        >
                                            <AnimatePresence>
                                                {piece && (
                                                    <motion.div
                                                        layoutId={piece.id}
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0.8, opacity: 0 }}
                                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                        className="w-32 h-32"
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

                    {/* Arrow */}
                    <div className="text-[#f0d9b5] hidden md:block">
                        <ArrowRight size={48} strokeWidth={1.5} />
                    </div>

                    {/* Target Board */}
                    <div className="bg-[#302e2b] p-6 rounded-lg shadow-lg border border-[#403d39]">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center">Target</h2>
                        <div className="flex justify-center">
                            <TargetBoard />
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
