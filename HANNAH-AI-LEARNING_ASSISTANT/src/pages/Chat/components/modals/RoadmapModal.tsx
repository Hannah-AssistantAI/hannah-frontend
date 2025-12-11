import React, { useState } from 'react'
import { Map, Download, Copy, Check, X } from 'lucide-react' // Added X icon
import ReactMarkdown from 'react-markdown'

interface RoadmapModalProps {
    isOpen: boolean
    onClose: () => void
    content: any
}

// Custom Vibrant Markdown Components
const MarkdownComponents: any = {
    h1: ({ node, ...props }: any) => (
        <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4" {...props} />
            <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
        </div>
    ),
    h2: ({ node, ...props }: any) => (
        <div className="flex items-center gap-4 mt-12 mb-6 group">
            <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <div className="font-bold text-xl">#</div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 border-b-2 border-slate-100 pb-2 w-full" {...props} />
        </div>
    ),
    h3: ({ node, ...props }: any) => (
        <h3 className="text-lg font-bold text-purple-700 mt-6 mb-3 flex items-center gap-2 uppercase tracking-wide text-sm" {...props} />
    ),
    p: ({ node, ...props }: any) => {
        const text = String(props.children);
        // Check if this paragraph contains checkmarks ( Goals section )
        if (text.includes("✅")) {
            const parts = text.split("✅").filter(part => part.trim().length > 0);
            return (
                <div className="flex flex-wrap gap-2 mb-4">
                    {parts.map((part, index) => (
                        <span key={index} className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-slate-700 font-medium shadow-sm hover:bg-green-100 transition-colors">
                            <span className="text-green-600 font-bold">✓</span>
                            {part.trim()}
                        </span>
                    ))}
                </div>
            );
        }
        return <p className="text-slate-600 leading-7 mb-4 text-[16px]" {...props} />;
    },
    ul: ({ node, ...props }: any) => (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8" {...props} />
    ),
    li: ({ node, ...props }: any) => {
        // Convert children to string to check for checkmarks
        const childText = React.Children.toArray(props.children).map(child => String(child)).join('');
        const isChecklist = childText.includes("✅");

        if (isChecklist) {
            return (
                <li className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl mb-2 col-span-2">
                    <div className="flex-shrink-0 text-green-600 bg-white p-1 rounded-full border border-green-200">
                        <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="text-slate-700 font-medium text-sm">{props.children}</span>
                </li>
            )
        }

        return (
            <li className="flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-xl hover:shadow-md hover:border-blue-200 transition-all duration-300 h-full" {...props}>
                <span className="text-slate-700 font-medium">{props.children}</span>
            </li>
        )
    },
    strong: ({ node, ...props }: any) => {
        const text = String(props.children);
        if (text.includes("Mục tiêu")) {
            return (
                <div className="flex items-center gap-2 mt-6 mb-3 p-2 bg-blue-50/50 rounded-lg border-l-4 border-blue-500 w-full col-span-2">
                    <span className="text-blue-600 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                        <span>🎯</span>
                        {props.children}
                    </span>
                </div>
            );
        }
        return <strong className="block text-blue-900 font-bold mb-1" {...props} />;
    },
    blockquote: ({ node, ...props }: any) => (
        <div className="my-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white shadow-lg overflow-hidden relative">
            <div className="relative z-10">
                <blockquote className="font-medium text-lg opacity-95 italic" {...props} />
            </div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-purple-500 opacity-20 rounded-full blur-xl"></div>
        </div>
    ),
    hr: ({ node, ...props }: any) => (
        <hr className="my-12 border-slate-200" {...props} />
    ),
};


export const RoadmapModal: React.FC<RoadmapModalProps> = ({ isOpen, onClose, content }) => {
    const [isCopied, setIsCopied] = useState(false)

    if (!isOpen) return null

    const handleCopy = async () => {
        if (!content?.content) return
        try {
            await navigator.clipboard.writeText(content.content)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    const handleDownload = () => {
        if (!content?.content) return

        const element = document.createElement("a");
        const file = new Blob([content.content], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);
        element.download = `${content.title || 'roadmap'}.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Map className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">{content?.title || 'Lộ trình học tập'}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title={isCopied ? "Đã sao chép" : "Sao chép"}
                            onClick={handleCopy}
                        >
                            {isCopied ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
                        </button>
                        <button
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Tải xuống"
                            onClick={handleDownload}
                        >
                            <Download size={20} />
                        </button>
                        <button
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ml-2"
                            onClick={onClose}
                            aria-label="Đóng"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Body - Vibrant Gradient Background */}
                <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
                    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-blue-100 p-8 md:p-12 min-h-full">
                        {content?.content ? (
                            <div className="font-sans">
                                <ReactMarkdown components={MarkdownComponents}>
                                    {content.content}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
                                <p>Đang tải lộ trình học tập...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

