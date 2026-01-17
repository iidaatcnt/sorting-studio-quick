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
  Split,
  Upload,
  Share2,
  Shuffle
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
const ARRAY_SIZE = 10;
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
    description: '配列の準備ができました。クイックソートを開始します。',
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

// --- Helper: Parse data input ---
const parseDataInput = (input: string): number[] | null => {
  const nums = input
    .split(/[,\s]+/)
    .map(s => s.trim())
    .filter(s => s !== '')
    .map(s => parseInt(s, 10))
    .filter(n => !isNaN(n) && n >= 1 && n <= 99);

  if (nums.length !== ARRAY_SIZE) return null;
  return nums;
};

// --- Main App ---
export default function QuickSortStudio() {
  const [array, setArray] = useState<number[]>([]);
  const [steps, setSteps] = useState<SortingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [dataInput, setDataInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [showDataPanel, setShowDataPanel] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize from URL parameter or random
  const initializeArray = useCallback((customArray?: number[]) => {
    const newArray = customArray || Array.from({ length: ARRAY_SIZE }, () => Math.floor(Math.random() * 80) + 15);
    const newSteps = generateSteps(newArray);
    setArray(newArray);
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
    setDataInput(newArray.join(', '));
    setInputError('');
  }, []);

  // Check URL for data parameter on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get('data');
      if (dataParam) {
        const parsed = parseDataInput(dataParam);
        if (parsed) {
          initializeArray(parsed);
          setShowDataPanel(false);
          return;
        }
      }
    }
    initializeArray();
  }, [initializeArray]);

  // Generate random array
  const generateRandom = useCallback(() => {
    initializeArray();
  }, [initializeArray]);

  // Apply custom data input
  const applyDataInput = useCallback(() => {
    const parsed = parseDataInput(dataInput);
    if (!parsed) {
      setInputError(`${ARRAY_SIZE}個の数値（1〜99）をカンマ区切りで入力してください`);
      return;
    }
    initializeArray(parsed);
    setShowDataPanel(false);
  }, [dataInput, initializeArray]);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseDataInput(text);
      if (parsed) {
        initializeArray(parsed);
        setShowDataPanel(false);
      } else {
        setInputError(`ファイルには${ARRAY_SIZE}個の数値（1〜99）が必要です`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [initializeArray]);

  // Copy share URL to clipboard
  const copyShareUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('data', array.join(','));
      navigator.clipboard.writeText(url.toString());
      alert('共有URLをコピーしました！\n他のソートアルゴリズムのURLに ?data=' + array.join(',') + ' を追加すると同じデータで比較できます。');
    }
  }, [array]);

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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="text-white w-5 h-5 fill-current" />
            </div>
            <h1 className="font-black italic tracking-tighter text-xl uppercase tracking-widest text-emerald-600">クイックソート (Quick Sort)</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-[10px] mono uppercase text-slate-400 font-bold tracking-widest">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-600 animate-pulse' : 'bg-slate-300'}`} />
                {isPlaying ? '実行中' : '停止中'}
              </div>
              <span className="opacity-20">|</span>
              <span>Step: {currentStep} / {steps.length - 1}</span>
            </div>
            <a href="https://github.com/iidaatcnt/sorting-studio-quick" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Visualization */}
        <div className="lg:col-span-8 flex flex-col gap-8">

          {/* Data Input Panel */}
          {showDataPanel && (
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Upload className="text-emerald-600 w-5 h-5" />
                <h2 className="font-bold text-sm text-slate-700">データ入力（{ARRAY_SIZE}個の数値）</h2>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <input
                    type="text"
                    value={dataInput}
                    onChange={(e) => { setDataInput(e.target.value); setInputError(''); }}
                    placeholder="例: 25, 41, 48, 50, 54, 61, 70, 76, 84, 92"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  {inputError && <p className="text-red-500 text-xs mt-2">{inputError}</p>}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={applyDataInput} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-500 transition-colors">適用</button>
                  <button onClick={generateRandom} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"><Shuffle size={16} />ランダム生成</button>
                  <input ref={fileInputRef} type="file" accept=".txt,.csv" onChange={handleFileUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"><Upload size={16} />ファイル読込</button>
                </div>
                <p className="text-xs text-slate-400">💡 同じデータで他のソートと比較するには、URLに <code className="bg-slate-100 px-1 rounded">?data=25,41,48...</code> を追加してください</p>
              </div>
            </div>
          )}

          <div className="relative aspect-video lg:aspect-square max-h-[500px] bg-white rounded-[2.5rem] border border-slate-200 p-16 flex items-end justify-center gap-3 overflow-hidden shadow-xl">
            <div className="absolute top-8 left-10 flex items-center gap-2 mono text-[10px] text-slate-400 uppercase font-black tracking-widest scale-90">
              <Zap size={14} className="text-emerald-600" />
              クイックソート・シミュレーター
            </div>

            <AnimatePresence mode="popLayout" initial={false}>
              {step.array.map((val, idx) => {
                const isSelected = step.indices.includes(idx);
                const isPivot = step.pivotIdx === idx;
                const inRange = step.activeRange ? (idx >= step.activeRange[0] && idx <= step.activeRange[1]) : false;

                let colorClass = "bg-slate-100 opacity-30";

                if (inRange) {
                  colorClass = "bg-slate-100 opacity-100";
                  if (isSelected) colorClass = "bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]";
                  if (isPivot) colorClass = "bg-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.4)] z-10 scale-105";
                }

                if (step.type === 'complete') {
                  colorClass = "bg-emerald-600 shadow-[0_0_20px_rgba(5,150,105,0.3)] opacity-100";
                }

                return (
                  <motion.div
                    key={`${idx}-${val}`}
                    layout
                    transition={{ type: 'spring', damping: 30, stiffness: 500 }}
                    style={{ height: `${val}%` }}
                    className={`flex-1 min-w-[20px] rounded-t-xl relative ${colorClass} transition-all duration-300`}
                  >
                    <div className={`absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-black ${isSelected || isPivot ? 'text-emerald-600' : 'text-slate-400 opacity-50'}`}>
                      {val}
                    </div>
                    {isPivot && step.type !== 'complete' && (
                      <div className="absolute inset-x-0 -bottom-8 flex flex-col items-center gap-1">
                        <div className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">Pivot</div>
                        <div className="w-1 h-4 bg-rose-500/20 rounded-full" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Range markers */}
            {step.activeRange && step.type !== 'complete' && (
              <div
                className="absolute bottom-6 h-1 bg-slate-100 rounded-full transition-all duration-500"
                style={{
                  left: `${(step.activeRange[0] / ARRAY_SIZE) * 100}%`,
                  width: `${((step.activeRange[1] - step.activeRange[0] + 1) / ARRAY_SIZE) * 100}%`
                }}
              />
            )}
          </div>

          <div className="px-10 py-8 bg-white rounded-[2rem] border border-slate-200 flex flex-col gap-8 shadow-lg">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex items-center gap-3">
                <button onClick={stepBackward} className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors text-slate-400"><StepBack size={20} /></button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-20 h-20 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center hover:bg-emerald-500 transition-all active:scale-95 shadow-xl shadow-emerald-600/20"
                >
                  {isPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="ml-1" />}
                </button>
                <button onClick={stepForward} className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors text-slate-400"><StepForward size={20} /></button>
                <button onClick={() => setShowDataPanel(!showDataPanel)} className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors text-slate-400 ml-4" title="データ入力パネル"><RotateCcw size={20} /></button>
                <button onClick={copyShareUrl} className="w-12 h-12 flex items-center justify-center bg-emerald-100 rounded-2xl hover:bg-emerald-200 transition-colors text-emerald-600 ml-2" title="共有URLをコピー"><Share2 size={20} /></button>
              </div>

              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mono text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-3">
                  <span>Latency_Tuning</span>
                  <span className="text-indigo-600">{Math.round((speed / 980) * 100)}%</span>
                </div>
                <input type="range" min="100" max="980" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value))} className="w-full appearance-none bg-slate-100 h-1.5 rounded-full accent-indigo-600 cursor-pointer" />
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-5 items-start">
              <div className="mt-1 flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 shrink-0 shadow-sm">
                <Info size={16} className="text-slate-400" />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {step.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Code & Theory */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="p-8 bg-white border border-slate-200 rounded-[2rem] shadow-lg">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-indigo-50 rounded-xl"><Split className="text-indigo-600 w-5 h-5" /></div>
              <h2 className="font-black text-xs uppercase tracking-[0.3em] text-slate-400">学習ガイド</h2>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
              <h3 className="text-indigo-600 font-black mb-3 text-sm uppercase italic">Quick Sort</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                枢軸（ピボット）を基準に、全要素を「小さいグループ」と「大きいグループ」に分割。これを再帰的に繰り返すことで、極めて高速に整列を完了させます。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mono text-[10px] font-black">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-colors">
                <div className="text-slate-400 mb-1 uppercase tracking-tighter italic">Avg_Speed</div>
                <div className="text-indigo-600 text-sm font-black">O(N log N)</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-colors">
                <div className="text-slate-400 mb-1 uppercase tracking-tighter italic">Method</div>
                <div className="text-indigo-600 text-sm font-black">Recursive</div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-[#0f172a] border border-slate-800 rounded-[2rem] flex-1 flex flex-col min-h-[450px] shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Code2 className="text-slate-400 w-5 h-5" />
                <h2 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500">Python 実装例</h2>
              </div>
              <div className="px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Python 3</span>
              </div>
            </div>

            <div className="flex-1 bg-black/20 p-8 rounded-2xl mono text-[10px] leading-[1.8] overflow-auto border border-slate-800 scrollbar-hide text-slate-300">
              {CODE_PYTHON.map((line, i) => (
                <div
                  key={i}
                  className={`flex gap-6 transition-all duration-300 ${step.codeLine === i ? 'text-indigo-400 bg-indigo-500/10 -mx-8 px-8 border-l-2 border-indigo-400 font-bold' : 'text-slate-700'}`}
                >
                  <span className="text-slate-800 tabular-nums w-4 select-none opacity-50">{i + 1}</span>
                  <pre className="whitespace-pre">{line}</pre>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-between opacity-50">
              <div className="flex gap-1 text-slate-800">
                <div className="w-2 h-2 rounded-full bg-current" />
                <div className="w-2 h-2 rounded-full bg-current" />
                <div className="w-2 h-2 rounded-full bg-current" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quick Sort // Core logic</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-slate-200 py-16 text-center">
        <div className="flex flex-col items-center gap-6">
          <Zap className="text-slate-200 w-8 h-8" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Fundamental Wisdom for the AI Era // Algorithm Literacy // しろいプログラミング教室</p>
        </div>
      </footer>
    </div>
  );
}
