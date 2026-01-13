'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  StepBack,
  Github,
  Info,
  Code2,
  Zap,
  Lightbulb,
  Target,
  Split
} from 'lucide-react';

// --- Types ---
type SortState = 'pivot' | 'compare' | 'swap' | 'partition' | 'sorted' | 'init' | 'complete';

interface SortingStep {
  array: number[];
  indices: number[]; // Pointers j, i
  pivotIdx?: number;
  activeRange?: [number, number]; // [low, high]
  type: SortState;
  description: string;
  codeLine?: number;
}

// --- Constants ---
const ARRAY_SIZE = 12; // A bit more for quick sort
const INITIAL_SPEED = 700;

const CODE_PYTHON = [
  "def quick_sort(arr, low, high):",
  "    if low < high:",
  "        pi = partition(arr, low, high)",
  "        quick_sort(arr, low, pi - 1)",
  "        quick_sort(arr, pi + 1, high)",
  "",
  "def partition(arr, low, high):",
  "    pivot = arr[high]",
  "    i = low - 1",
  "    for j in range(low, high):",
  "        if arr[j] < pivot:",
  "            i += 1",
  "            arr[i], arr[j] = arr[j], arr[i]",
  "    arr[i+1], arr[high] = arr[high], arr[i+1]"
];

// --- Algorithm Logic ---
const generateSteps = (initialArray: number[]): SortingStep[] => {
  const steps: SortingStep[] = [];
  const arr = [...initialArray];
  const sortedArr = new Array(arr.length).fill(false);

  const pushStep = (type: SortState, desc: string, line: number, i?: number, j?: number, pivot?: number, range?: [number, number]) => {
    const indices = [];
    if (i !== undefined) indices.push(i);
    if (j !== undefined) indices.push(j);
    steps.push({
      array: [...arr],
      indices,
      pivotIdx: pivot,
      activeRange: range,
      type,
      description: desc,
      codeLine: line
    });
  };

  const partition = (low: number, high: number): number => {
    const pivot = arr[high];
    pushStep('pivot', `ピボット（基準となる値）を ${pivot} に設定します。`, 7, undefined, undefined, high, [low, high]);

    let i = low - 1;
    pushStep('init', `インデックス ${low} から ${high - 1} までの範囲で比較を開始します。`, 8, i, undefined, high, [low, high]);

    for (let j = low; j < high; j++) {
      pushStep('compare', `ピボット ${pivot} と ${arr[j]} を比較します。`, 10, i, j, high, [low, high]);

      if (arr[j] < pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        pushStep('swap', `${arr[i]} はピボットより小さいので、左側のグループ（インデックス ${i}）へ移動します。`, 12, i, j, high, [low, high]);
      }
    }

    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    pushStep('partition', `最後に、ピボット ${pivot} を中央（インデックス ${i + 1}）に配置して、分割完了です。`, 13, i + 1, undefined, i + 1, [low, high]);

    return i + 1;
  };

  const quickSort = (low: number, high: number) => {
    if (low < high) {
      const pi = partition(low, high);
      sortedArr[pi] = true; // The pivot is now at its final sorted position

      quickSort(low, pi - 1);
      quickSort(pi + 1, high);
    } else if (low === high) {
      sortedArr[low] = true;
    }
  };

  steps.push({
    array: [...arr],
    indices: [],
    type: 'init',
    description: 'クイックソート（分割統治法）を開始します。高速な並び替えを実現します。',
    codeLine: 0
  });

  quickSort(0, arr.length - 1);

  steps.push({
    array: [...arr],
    indices: Array.from({ length: arr.length }, (_, k) => k),
    type: 'complete',
    description: 'すべての分割と整列が終了しました！最速の証です。',
    codeLine: 0
  });

  return steps;
};


// --- Main App ---
export default function QuickSortStudio() {
  const [array, setArray] = useState<number[]>([]);
  const [steps, setSteps] = useState<SortingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    const newArray = Array.from({ length: ARRAY_SIZE }, () => Math.floor(Math.random() * 80) + 15);
    const newSteps = generateSteps(newArray);
    setArray(newArray);
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  const stepForward = useCallback(() => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1)), [steps.length]);
  const stepBackward = useCallback(() => setCurrentStep(prev => Math.max(prev - 1, 0)), []);

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      timerRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1001 - speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, currentStep, steps.length, speed]);

  const step = steps[currentStep] || { array: [], indices: [], type: 'init', description: '' };

  return (
    <div className="min-h-screen bg-[#06090f] text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="text-slate-950 w-5 h-5 fill-current" />
            </div>
            <h1 className="font-black italic tracking-tighter text-xl uppercase">Quick_Sort_Studio</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-[10px] mono uppercase text-slate-500 font-bold tracking-widest">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
                {isPlaying ? 'Computing' : 'Paused'}
              </div>
              <span className="opacity-20">|</span>
              <span>Step: {currentStep} / {steps.length - 1}</span>
            </div>
            <a href="https://github.com/iidaatcnt/sorting-studio-quick" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors">
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Visualization */}
        <div className="lg:col-span-8 flex flex-col gap-8">

          <div className="relative aspect-video lg:aspect-square max-h-[500px] bg-[#0d1117] rounded-[2.5rem] border border-white/5 p-16 flex items-end justify-center gap-3 overflow-hidden shadow-2xl">
            <div className="absolute top-8 left-10 flex items-center gap-2 mono text-[10px] text-slate-600 uppercase font-black tracking-widest scale-90">
              <Target size={14} className="text-emerald-500" />
              Divide & Conquer // Partitioning
            </div>

            <AnimatePresence mode="popLayout" initial={false}>
              {step.array.map((val, idx) => {
                const isSelected = step.indices.includes(idx);
                const isPivot = step.pivotIdx === idx;
                const inRange = step.activeRange ? (idx >= step.activeRange[0] && idx <= step.activeRange[1]) : false;

                let colorClass = "bg-slate-800/40 opacity-30";
                let scale = 1;

                if (inRange) {
                  colorClass = "bg-slate-800 opacity-100";
                  if (isSelected) colorClass = "bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]";
                  if (isPivot) colorClass = "bg-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.5)] z-10 scale-105";
                }

                if (step.type === 'complete') {
                  colorClass = "bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)] opacity-100";
                }

                return (
                  <motion.div
                    key={`${idx}-${val}`}
                    layout
                    transition={{ type: 'spring', damping: 30, stiffness: 500 }}
                    style={{ height: `${val}%` }}
                    className={`flex-1 min-w-[20px] rounded-t-xl relative ${colorClass} transition-all duration-300`}
                  >
                    <div className={`absolute -top-8 left-1/2 -translate-x-1/2 mono text-[10px] font-black ${isSelected || isPivot ? 'text-white' : 'text-slate-600 opacity-50'}`}>
                      {val}
                    </div>
                    {isPivot && step.type !== 'complete' && (
                      <div className="absolute inset-x-0 -bottom-8 flex flex-col items-center gap-1">
                        <div className="text-[9px] font-black text-amber-400 uppercase tracking-tighter">Pivot</div>
                        <div className="w-1 h-4 bg-amber-500/20 rounded-full" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Range markers */}
            {step.activeRange && step.type !== 'complete' && (
              <div
                className="absolute bottom-6 h-1 bg-white/5 rounded-full transition-all duration-500"
                style={{
                  left: `${(step.activeRange[0] / ARRAY_SIZE) * 100}%`,
                  width: `${((step.activeRange[1] - step.activeRange[0] + 1) / ARRAY_SIZE) * 100}%`
                }}
              />
            )}
          </div>

          <div className="px-10 py-8 bg-[#0d1117]/80 rounded-[2rem] border border-white/10 flex flex-col gap-8 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex items-center gap-3">
                <button onClick={stepBackward} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-white/10 transition-colors text-slate-400"><StepBack size={20} /></button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-20 h-20 bg-emerald-500 text-slate-950 rounded-3xl flex items-center justify-center hover:bg-white transition-all active:scale-90 shadow-2xl shadow-emerald-500/20"
                >
                  {isPlaying ? <Pause fill="currentColor" size={28} /> : <Play fill="currentColor" size={28} className="ml-1" />}
                </button>
                <button onClick={stepForward} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-white/10 transition-colors text-slate-400"><StepForward size={20} /></button>
                <button onClick={reset} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-white/10 transition-colors text-slate-400 ml-4"><RotateCcw size={20} /></button>
              </div>

              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mono text-[10px] text-slate-600 uppercase font-black tracking-[0.2em] mb-3">
                  <span>Latency_Tuning</span>
                  <span className="text-emerald-500">{Math.round((speed / 980) * 100)}%</span>
                </div>
                <input type="range" min="100" max="980" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value))} className="w-full appearance-none bg-emerald-500/10 h-1.5 rounded-full accent-emerald-500 cursor-pointer" />
              </div>
            </div>

            <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex gap-5 items-start">
              <div className="mt-1 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                <Info size={16} className="text-emerald-400" />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                {step.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Code & Theory */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="p-8 bg-zinc-900 border border-white/5 rounded-[2rem] shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl"><Split className="text-emerald-400 w-5 h-5" /></div>
              <h2 className="font-black text-xs uppercase tracking-[0.3em]">Algorithm_Dossier</h2>
            </div>
            <div className="p-6 bg-[#000]/40 rounded-2xl border border-white/5 mb-8">
              <h3 className="text-emerald-400 font-black mb-3 text-sm uppercase italic">Quick Sort</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                枢軸（ピボット）を基準に、全要素を「小さいグループ」と「大きいグループ」に分割。これを再帰的に繰り返すことで、極めて高速に整列を完了させます。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mono text-[10px] font-black">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-colors">
                <div className="text-slate-600 mb-1 uppercase tracking-tighter italic">Avg_Speed</div>
                <div className="text-white text-sm">O(N log N)</div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-colors">
                <div className="text-slate-600 mb-1 uppercase tracking-tighter italic">Method</div>
                <div className="text-white text-sm">Recursive</div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-[#000] border border-white/5 rounded-[2rem] flex-1 flex flex-col min-h-[450px] shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Code2 className="text-slate-600 w-5 h-5" />
                <h2 className="font-black text-[10px] uppercase tracking-[0.3em]">Exec_Console</h2>
              </div>
              <div className="px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <span className="text-[9px] font-black text-emerald-500 uppercase">Python 3</span>
              </div>
            </div>

            <div className="flex-1 bg-zinc-950/30 p-8 rounded-2xl mono text-[10px] leading-[1.8] overflow-auto border border-white/5 custom-scrollbar">
              {CODE_PYTHON.map((line, i) => (
                <div
                  key={i}
                  className={`flex gap-6 transition-all duration-300 ${step.codeLine === i ? 'text-emerald-400 bg-emerald-400/10 -mx-8 px-8 border-l-2 border-emerald-400 font-bold' : 'text-slate-700'}`}
                >
                  <span className="text-slate-800 tabular-nums w-4 select-none opacity-50">{i + 1}</span>
                  <pre className="whitespace-pre">{line}</pre>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-between opacity-50">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-800" />
                <div className="w-2 h-2 rounded-full bg-slate-800" />
                <div className="w-2 h-2 rounded-full bg-slate-800" />
              </div>
              <span className="text-[10px] mono text-slate-700 uppercase tracking-widest">quickSort_kernel_v1</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-white/5 py-16 text-center opacity-30">
        <div className="flex flex-col items-center gap-6">
          <Zap className="text-slate-800 w-8 h-8" />
          <p className="text-[10px] mono text-slate-800 uppercase tracking-[0.8em]">Interactive_Learning_Series // Informatics_I</p>
        </div>
      </footer>
    </div>
  );
}
