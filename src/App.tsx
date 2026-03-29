/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ExternalLink, 
  Layout, 
  Zap, 
  Server, 
  ShieldCheck, 
  Cpu, 
  Globe, 
  Palette, 
  CheckCircle,
  Code2,
  BookOpen,
  Github,
  Sparkles,
  ChevronRight,
  MessageSquare,
  Newspaper,
  Plus,
  Send,
  User,
  Calendar,
  ArrowLeft,
  LogIn,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { JS_RESOURCES, Resource } from './constants';
import { cn } from './lib/utils';
import { GoogleGenAI } from "@google/genai";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  where,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db, auth, signIn, logout } from './firebase';
import ReactMarkdown from 'react-markdown';

// --- Types ---
interface Tutorial {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  createdAt: any;
}

interface ForumTopic {
  id: string;
  title: string;
  category: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  lastReplyAt: any;
}

interface ForumPost {
  id: string;
  topicId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
}

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: string;
  publishedAt: any;
  imageUrl?: string;
}

// --- Components ---

const iconMap: Record<string, React.ReactNode> = {
  Layout: <Layout className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
  Server: <Server className="w-5 h-5" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5" />,
  Cpu: <Cpu className="w-5 h-5" />,
  Globe: <Globe className="w-5 h-5" />,
  Palette: <Palette className="w-5 h-5" />,
  CheckCircle: <CheckCircle className="w-5 h-5" />,
};

const categories = ['All', 'Frontend', 'Backend', 'Runtime', 'Tooling', 'Testing'];
const tutorialCategories = ['Basics', 'Frontend', 'Backend', 'Build Tools'];
const forumCategories = ['General', 'React', 'Node.js', 'TypeScript', 'Help Wanted'];

export default function App() {
  const [view, setView] = useState<'home' | 'tutorials' | 'forum' | 'blog'>('home');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Home State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Data State
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [forumTopics, setForumTopics] = useState<ForumTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [topicPosts, setTopicPosts] = useState<ForumPost[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Data
  useEffect(() => {
    if (!isAuthReady) return;

    // Seed Data if empty
    const seedData = async () => {
      const tutorialSnap = await getDocs(collection(db, 'tutorials'));
      if (tutorialSnap.empty) {
        const initialTutorials = [
          { title: 'JavaScript Basics', category: 'Basics', author: 'JS Hub Team', content: 'Learn about variables, data types, and functions in JavaScript. This is the foundation of all web development.', createdAt: serverTimestamp() },
          { title: 'React Hooks Deep Dive', category: 'Frontend', author: 'React Expert', content: 'Master useState, useEffect, and custom hooks to build powerful React applications.', createdAt: serverTimestamp() },
          { title: 'Node.js & Express', category: 'Backend', author: 'Backend Guru', content: 'Build scalable APIs with Node.js and the Express framework.', createdAt: serverTimestamp() },
          { title: 'Vite: The Modern Bundler', category: 'Build Tools', author: 'Tooling Specialist', content: 'Why Vite is replacing Webpack for modern frontend projects.', createdAt: serverTimestamp() }
        ];
        for (const t of initialTutorials) {
          await addDoc(collection(db, 'tutorials'), t);
        }
      }

      const blogSnap = await getDocs(collection(db, 'blog_posts'));
      if (blogSnap.empty) {
        const initialBlogs = [
          { title: 'The Future of JavaScript in 2026', author: 'Ecosystem Analyst', content: 'JavaScript continues to dominate with new features like native AI integration and improved performance.', publishedAt: serverTimestamp() },
          { title: 'Why Bun is Gaining Traction', author: 'Runtime Enthusiast', content: 'Bun is not just a runtime, it is a complete toolkit for JavaScript and TypeScript.', publishedAt: serverTimestamp() }
        ];
        for (const b of initialBlogs) {
          await addDoc(collection(db, 'blog_posts'), b);
        }
      }
    };
    seedData();

    // Tutorials
    const qTutorials = query(collection(db, 'tutorials'), orderBy('createdAt', 'desc'));
    const unsubTutorials = onSnapshot(qTutorials, (snapshot) => {
      setTutorials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tutorial)));
    });

    // Blog Posts
    const qBlog = query(collection(db, 'blog_posts'), orderBy('publishedAt', 'desc'));
    const unsubBlog = onSnapshot(qBlog, (snapshot) => {
      setBlogPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost)));
    });

    // Forum Topics
    const qForum = query(collection(db, 'forum_topics'), orderBy('lastReplyAt', 'desc'));
    const unsubForum = onSnapshot(qForum, (snapshot) => {
      setForumTopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumTopic)));
    });

    return () => {
      unsubTutorials();
      unsubBlog();
      unsubForum();
    };
  }, [isAuthReady]);

  // Fetch Posts for Selected Topic
  useEffect(() => {
    if (!selectedTopic) return;
    const qPosts = query(
      collection(db, `forum_topics/${selectedTopic.id}/posts`), 
      orderBy('createdAt', 'asc')
    );
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      setTopicPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumPost)));
    });
    return () => unsubPosts();
  }, [selectedTopic]);

  const filteredResources = useMemo(() => {
    return JS_RESOURCES.filter(resource => {
      const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || resource.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const generateInsight = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Give a brief, 2-sentence expert insight about the current state of the JavaScript ecosystem in 2026. Focus on one specific trend like AI integration, performance, or new standards.",
      });
      setAiInsight(response.text || "The JS ecosystem continues to evolve with a strong focus on edge computing and AI-native development tools.");
    } catch (error) {
      console.error("AI Insight Error:", error);
      setAiInsight("JavaScript remains the backbone of the web, with a growing emphasis on type-safety and server-side performance.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Forum Handlers ---
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('General');
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTopicTitle.trim()) return;
    setIsCreatingTopic(true);
    try {
      const topicRef = await addDoc(collection(db, 'forum_topics'), {
        title: newTopicTitle,
        category: newTopicCategory,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        lastReplyAt: serverTimestamp()
      });
      setNewTopicTitle('');
      setIsCreatingTopic(false);
    } catch (error) {
      console.error("Error creating topic:", error);
      setIsCreatingTopic(false);
    }
  };

  const [newPostContent, setNewPostContent] = useState('');
  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTopic || !newPostContent.trim()) return;
    try {
      await addDoc(collection(db, `forum_topics/${selectedTopic.id}/posts`), {
        topicId: selectedTopic.id,
        content: newPostContent,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'forum_topics', selectedTopic.id), {
        lastReplyAt: serverTimestamp()
      });
      setNewPostContent('');
    } catch (error) {
      console.error("Error replying:", error);
    }
  };

  // --- Blog Handlers ---
  const [isPostingBlog, setIsPostingBlog] = useState(false);
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogContent, setNewBlogContent] = useState('');

  const handlePostBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newBlogTitle.trim() || !newBlogContent.trim()) return;
    setIsPostingBlog(true);
    try {
      await addDoc(collection(db, 'blog_posts'), {
        title: newBlogTitle,
        content: newBlogContent,
        author: user.displayName || 'Anonymous',
        publishedAt: serverTimestamp()
      });
      setNewBlogTitle('');
      setNewBlogContent('');
      setIsPostingBlog(false);
    } catch (error) {
      console.error("Error posting blog:", error);
      setIsPostingBlog(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
              <div className="bg-js-yellow p-1.5 rounded-md">
                <Code2 className="w-6 h-6 text-js-black" />
              </div>
              <span className="font-bold text-xl tracking-tight text-zinc-900">JS.ORG Hub</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
              <button 
                onClick={() => setView('home')} 
                className={cn("hover:text-js-black transition-colors", view === 'home' && "text-js-black")}
              >
                Ecosystem
              </button>
              <button 
                onClick={() => setView('tutorials')} 
                className={cn("hover:text-js-black transition-colors", view === 'tutorials' && "text-js-black")}
              >
                Tutorials
              </button>
              <button 
                onClick={() => setView('forum')} 
                className={cn("hover:text-js-black transition-colors", view === 'forum' && "text-js-black")}
              >
                Forum
              </button>
              <button 
                onClick={() => setView('blog')} 
                className={cn("hover:text-js-black transition-colors", view === 'blog' && "text-js-black")}
              >
                Blog
              </button>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-600 hidden sm:inline">{user.displayName}</span>
                  <button onClick={logout} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-600">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={signIn} 
                  className="flex items-center gap-2 bg-js-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {view === 'home' && (
          <>
            {/* Hero Section */}
            <section className="py-20 px-4 bg-gradient-to-b from-zinc-50 to-white overflow-hidden relative">
              <div className="max-w-4xl mx-auto text-center relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className="text-5xl md:text-7xl font-bold text-zinc-900 mb-6 tracking-tight leading-tight">
                    Explore the Modern <br />
                    <span className="text-js-black bg-js-yellow px-4 py-1 rounded-lg">JavaScript</span> Ecosystem
                  </h1>
                  <p className="text-xl text-zinc-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                    A curated directory of the most essential tools, frameworks, and runtimes powering the modern web development landscape.
                  </p>
                </motion.div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search libraries, tools..."
                      className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl shadow-sm focus:ring-2 focus:ring-js-yellow focus:border-js-yellow outline-none transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Abstract Background Elements */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-js-yellow rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-zinc-300 rounded-full blur-3xl" />
              </div>
            </section>

            {/* AI Insight Section */}
            <section className="max-w-7xl mx-auto px-4 mb-12">
              <div className="bg-zinc-900 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-js-yellow" />
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">AI Ecosystem Insight</span>
                    </div>
                    <AnimatePresence mode="wait">
                      {aiInsight ? (
                        <motion.p 
                          key="insight"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-lg md:text-xl font-medium leading-relaxed"
                        >
                          "{aiInsight}"
                        </motion.p>
                      ) : (
                        <p className="text-lg md:text-xl text-zinc-400 italic">
                          Click the button to generate a real-time ecosystem update from Gemini AI...
                        </p>
                      )}
                    </AnimatePresence>
                  </div>
                  <button
                    onClick={generateInsight}
                    disabled={isGenerating}
                    className="whitespace-nowrap px-6 py-3 bg-js-yellow text-js-black font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                  >
                    {isGenerating ? "Analyzing..." : "Get AI Insight"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>

            {/* Latest Blog Section */}
            <section className="max-w-7xl mx-auto px-4 mb-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-zinc-900">Latest News</h2>
                <button onClick={() => setView('blog')} className="text-sm font-bold text-zinc-600 hover:text-js-black flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogPosts.slice(0, 3).map(post => (
                  <div key={post.id} className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
                      <Calendar className="w-3 h-3" />
                      {post.publishedAt?.toDate().toLocaleDateString()}
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-3">{post.title}</h3>
                    <div className="text-zinc-500 text-sm line-clamp-3 mb-4">
                      <ReactMarkdown>{post.content}</ReactMarkdown>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-600">
                      <User className="w-4 h-4" />
                      {post.author}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Filters & Grid */}
            <section className="max-w-7xl mx-auto px-4 pb-24">
              <div className="flex flex-wrap items-center gap-2 mb-8">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                      activeCategory === category 
                        ? "bg-js-black text-white border-js-black shadow-md" 
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                  {filteredResources.map((resource, index) => (
                    <motion.div
                      key={resource.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="group bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-xl hover:border-js-yellow/50 transition-all flex flex-col h-full"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-zinc-50 rounded-xl group-hover:bg-js-yellow/10 transition-colors">
                          {iconMap[resource.icon]}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-100 px-2 py-1 rounded">
                          {resource.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-zinc-900 mb-2">{resource.name}</h3>
                      <p className="text-zinc-500 text-sm leading-relaxed mb-6 flex-grow">
                        {resource.description}
                      </p>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-bold text-zinc-900 group-hover:text-js-black transition-colors"
                      >
                        Documentation
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          </>
        )}

        {view === 'tutorials' && (
          <section className="max-w-7xl mx-auto px-4 py-12">
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-zinc-900 mb-4">Learning Center</h1>
              <p className="text-zinc-600">Master JavaScript and Web Development with our organized tutorials.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              <div className="lg:col-span-1 space-y-2">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Topics</h3>
                {tutorialCategories.map(cat => (
                  <button 
                    key={cat}
                    className="w-full text-left px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors font-medium text-zinc-700"
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tutorials.length > 0 ? tutorials.map(tutorial => (
                    <div key={tutorial.id} className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-js-yellow bg-js-black px-2 py-1 rounded mb-4 inline-block">
                        {tutorial.category}
                      </span>
                      <h3 className="text-xl font-bold text-zinc-900 mb-3">{tutorial.title}</h3>
                      <div className="text-zinc-500 text-sm line-clamp-3 mb-6">
                        <ReactMarkdown>{tutorial.content}</ReactMarkdown>
                      </div>
                      <button className="text-sm font-bold text-js-black flex items-center gap-1">
                        Read Tutorial <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )) : (
                    <div className="col-span-2 py-20 text-center bg-white border border-dashed border-zinc-300 rounded-3xl">
                      <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                      <p className="text-zinc-400">No tutorials available yet. Stay tuned!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {view === 'forum' && (
          <section className="max-w-7xl mx-auto px-4 py-12">
            {selectedTopic ? (
              <div className="max-w-4xl mx-auto">
                <button 
                  onClick={() => setSelectedTopic(null)}
                  className="flex items-center gap-2 text-zinc-600 hover:text-js-black mb-8 font-bold"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Topics
                </button>
                <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold bg-js-yellow px-2 py-1 rounded">{selectedTopic.category}</span>
                    <span className="text-xs text-zinc-400">{selectedTopic.createdAt?.toDate().toLocaleString()}</span>
                  </div>
                  <h1 className="text-3xl font-bold text-zinc-900 mb-6">{selectedTopic.title}</h1>
                  <div className="flex items-center gap-3 border-t border-zinc-100 pt-6">
                    <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{selectedTopic.authorName}</p>
                      <p className="text-xs text-zinc-500">Topic Creator</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 mb-12">
                  {topicPosts.map(post => (
                    <div key={post.id} className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-zinc-50 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-zinc-400" />
                          </div>
                          <span className="text-sm font-bold text-zinc-900">{post.authorName}</span>
                        </div>
                        <span className="text-xs text-zinc-400">{post.createdAt?.toDate().toLocaleString()}</span>
                      </div>
                      <p className="text-zinc-700 leading-relaxed">{post.content}</p>
                    </div>
                  ))}
                </div>

                {user ? (
                  <form onSubmit={handleReply} className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-lg">
                    <textarea
                      placeholder="Write your reply..."
                      className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-js-yellow min-h-[120px] mb-4"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <button 
                        type="submit"
                        className="bg-js-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                      >
                        Post Reply <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-zinc-100 rounded-3xl p-8 text-center">
                    <LogIn className="w-8 h-8 text-zinc-400 mx-auto mb-4" />
                    <p className="text-zinc-600 mb-4">Please sign in to participate in the discussion.</p>
                    <button onClick={signIn} className="bg-js-black text-white px-6 py-2 rounded-xl font-bold">Sign In</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="lg:col-span-1">
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm sticky top-24">
                    <h3 className="text-lg font-bold mb-6">Forum</h3>
                    <div className="space-y-2 mb-8">
                      {forumCategories.map(cat => (
                        <button key={cat} className="w-full text-left px-4 py-2 rounded-lg hover:bg-zinc-50 text-sm font-medium text-zinc-600">
                          {cat}
                        </button>
                      ))}
                    </div>
                    {user && (
                      <button 
                        onClick={() => setIsCreatingTopic(true)}
                        className="w-full bg-js-yellow text-js-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                      >
                        <Plus className="w-4 h-4" /> New Topic
                      </button>
                    )}
                  </div>
                </div>
                <div className="lg:col-span-3">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input 
                        type="text" 
                        placeholder="Search discussions..." 
                        className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-js-yellow"
                      />
                    </div>
                  </div>

                  {isCreatingTopic && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-js-yellow rounded-3xl p-6 mb-8 shadow-xl"
                    >
                      <h3 className="text-xl font-bold mb-4">Start a New Discussion</h3>
                      <form onSubmit={handleCreateTopic}>
                        <input 
                          type="text" 
                          placeholder="Topic Title" 
                          className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-js-yellow"
                          value={newTopicTitle}
                          onChange={(e) => setNewTopicTitle(e.target.value)}
                        />
                        <div className="flex flex-wrap gap-4 items-center justify-between">
                          <select 
                            className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none"
                            value={newTopicCategory}
                            onChange={(e) => setNewTopicCategory(e.target.value)}
                          >
                            {forumCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                          <div className="flex gap-2">
                            <button 
                              type="button"
                              onClick={() => setIsCreatingTopic(false)}
                              className="px-6 py-3 text-zinc-500 font-bold"
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit"
                              className="bg-js-black text-white px-6 py-3 rounded-xl font-bold"
                            >
                              Create Topic
                            </button>
                          </div>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    {forumTopics.length > 0 ? forumTopics.map(topic => (
                      <div 
                        key={topic.id} 
                        onClick={() => setSelectedTopic(topic)}
                        className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-js-yellow cursor-pointer transition-all flex items-center justify-between gap-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{topic.category}</span>
                            <span className="text-zinc-300">•</span>
                            <span className="text-xs text-zinc-400">{topic.createdAt?.toDate().toLocaleDateString()}</span>
                          </div>
                          <h3 className="text-lg font-bold text-zinc-900 mb-2">{topic.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <User className="w-3 h-3" />
                            {topic.authorName}
                          </div>
                        </div>
                        <div className="text-right hidden sm:block">
                          <div className="flex items-center gap-1 text-zinc-400 text-xs mb-1">
                            <MessageSquare className="w-3 h-3" />
                            Last reply
                          </div>
                          <p className="text-xs font-bold text-zinc-600">{topic.lastReplyAt?.toDate().toLocaleDateString()}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="py-20 text-center bg-white border border-dashed border-zinc-300 rounded-3xl">
                        <MessageSquare className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                        <p className="text-zinc-400">No discussions yet. Be the first to start one!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {view === 'blog' && (
          <section className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <div>
                <h1 className="text-4xl font-bold text-zinc-900 mb-4">Ecosystem News</h1>
                <p className="text-zinc-600">Stay updated with the latest articles and blog posts.</p>
              </div>
              {user && (
                <button 
                  onClick={() => setIsPostingBlog(!isPostingBlog)}
                  className="bg-js-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Post Article
                </button>
              )}
            </div>

            {isPostingBlog && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white border border-zinc-200 rounded-3xl p-8 mb-12 shadow-xl"
              >
                <h3 className="text-2xl font-bold mb-6">Create New Article</h3>
                <form onSubmit={handlePostBlog}>
                  <input 
                    type="text" 
                    placeholder="Article Title" 
                    className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-js-yellow"
                    value={newBlogTitle}
                    onChange={(e) => setNewBlogTitle(e.target.value)}
                  />
                  <textarea 
                    placeholder="Article Content (Markdown supported)" 
                    className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-xl mb-6 outline-none focus:ring-2 focus:ring-js-yellow min-h-[300px]"
                    value={newBlogContent}
                    onChange={(e) => setNewBlogContent(e.target.value)}
                  />
                  <div className="flex justify-end gap-4">
                    <button type="button" onClick={() => setIsPostingBlog(false)} className="px-6 py-3 text-zinc-500 font-bold">Cancel</button>
                    <button type="submit" className="bg-js-yellow text-js-black px-8 py-3 rounded-xl font-bold">Publish Article</button>
                  </div>
                </form>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {blogPosts.length > 0 ? blogPosts.map(post => (
                <div key={post.id} className="bg-white border border-zinc-200 rounded-3xl overflow-hidden hover:shadow-xl transition-all flex flex-col">
                  <div className="p-8 flex-grow">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
                      <Calendar className="w-3 h-3" />
                      {post.publishedAt?.toDate().toLocaleDateString()}
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 mb-4">{post.title}</h3>
                    <div className="text-zinc-600 prose prose-sm max-w-none line-clamp-4 mb-8">
                      <ReactMarkdown>{post.content}</ReactMarkdown>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                      <div className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                        <div className="w-8 h-8 bg-js-yellow rounded-full flex items-center justify-center text-xs">
                          {post.author[0]}
                        </div>
                        {post.author}
                      </div>
                      <button className="text-sm font-bold text-js-black flex items-center gap-1">
                        Read More <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-2 py-20 text-center bg-white border border-dashed border-zinc-300 rounded-3xl">
                  <Newspaper className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                  <p className="text-zinc-400">No articles published yet.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-js-yellow p-1 rounded">
              <Code2 className="w-5 h-5 text-js-black" />
            </div>
            <span className="font-bold text-lg">JS.ORG Hub</span>
          </div>
          <p className="text-zinc-500 text-sm">
            &copy; {new Date().getFullYear()} JS Ecosystem Explorer. Built for the community.
          </p>
          <div className="flex items-center gap-6">
            <a href="https://js.org" className="text-zinc-400 hover:text-js-black transition-colors">js.org</a>
            <a href="#" className="text-zinc-400 hover:text-js-black transition-colors">Privacy</a>
            <a href="#" className="text-zinc-400 hover:text-js-black transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
