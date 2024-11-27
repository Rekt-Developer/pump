"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  FaTelegramPlane,
  FaTwitter,
  FaInstagram,
  FaStar,
} from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import {
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
require("@solana/wallet-adapter-react-ui/styles.css");

interface TokenMetadata {
  name?: string;
  symbol?: string;
  image?: string;
  website?: string;
  telegram?: string;
  twitter?: string;
  description?: string;
  [key: string]: any;
}

interface Token {
  uri: string;
  marketCapSol?: number;
  metadata?: TokenMetadata;
  initialBuy?: number;
  mint?: string;
  [key: string]: any;
}

const Home: React.FC = () => {
  const [isClient, setIsClient] = useState<boolean>(false);
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [favorites, setFavorites] = useState<Token[]>([]);
  const [showFavoritesWidget, setShowFavoritesWidget] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterBy, setFilterBy] = useState<"name" | "symbol">("name");
  const [minMarketCap, setMinMarketCap] = useState<string>("");
  const [maxMarketCap, setMaxMarketCap] = useState<string>("");
  const [minInitialBuy, setMinInitialBuy] = useState<string>("");
  const [maxInitialBuy, setMaxInitialBuy] = useState<string>("");
  const [visibleTokens, setVisibleTokens] = useState<number>(12);
  const scrollRef = useRef<HTMLDivElement>(null);

  const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

  useEffect(() => {
    setIsClient(true);
    const savedFavorites: Token[] = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    setFavorites(savedFavorites);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const ws = new WebSocket("wss://pumpportal.fun/api/data");

    ws.onopen = () => {
      console.log("WebSocket connection established");
      ws.send(JSON.stringify({ method: "subscribeNewToken" }));
    };

    ws.onmessage = async (message: MessageEvent) => {
      const data = JSON.parse(message.data);
      console.log("WebSocket message received:", data);

      if (data.uri) {
        try {
          const metadataResponse = await axios.get<TokenMetadata>(data.uri);
          console.log("Fetched metadata:", metadataResponse.data);

          const tokenData: Token = {
            ...data,
            metadata: metadataResponse.data,
          };

          setAllTokens((prev) => [tokenData, ...prev]);
        } catch (error: any) {
          console.error("Error fetching metadata from IPFS:", error);
        }
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    ws.onerror = (error: any) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [isClient]);

  const toggleFavorite = (token: Token) => {
    const updatedFavorites = favorites.some((fav) => fav.uri === token.uri)
      ? favorites.filter((fav) => fav.uri !== token.uri)
      : [...favorites, token];

    setFavorites(updatedFavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  };

  const isFavorite = (token: Token) =>
    favorites.some((fav) => fav.uri === token.uri);

  const calculateScore = (token: Token) => {
    const { marketCapSol, metadata } = token;
    let score = 0;

    if (metadata?.website) score += 3;
    if (metadata?.telegram) score += 3;
    if (metadata?.twitter) score += 3;

    if (marketCapSol && marketCapSol >= 10) {
      score += 1;
    } else {
      score = Math.min(score, 7);
    }

    return Math.min(score, 10);
  };

  const filteredTokens = allTokens.filter((token) => {
    const valueToFilter =
      token.metadata?.[filterBy]?.toLowerCase() || "";

    const marketCap = token.marketCapSol || 0;
    const withinMarketCap =
      (!minMarketCap || marketCap >= parseFloat(minMarketCap)) &&
      (!maxMarketCap || marketCap <= parseFloat(maxMarketCap));

    const initialBuy = token.initialBuy || 0;
    const withinInitialBuy =
      (!minInitialBuy || initialBuy >= parseFloat(minInitialBuy)) &&
      (!maxInitialBuy || initialBuy <= parseFloat(maxInitialBuy));

    return (
      valueToFilter.includes(searchQuery.toLowerCase()) &&
      withinMarketCap &&
      withinInitialBuy
    );
  });

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 200
    ) {
      setLoading(true);
      setTimeout(() => {
        setVisibleTokens((prev) => prev + 12);
        setLoading(false);
      }, 300);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="h-full bg-[#1a1f2e] text-white relative">
            {/* Navigation Bar */}
            <nav className="flex flex-wrap justify-between w-full p-4 items-center h-fit bg-[#1a1f2e] border-b border-[#ef6401]">
              <div className="flex items-center flex-wrap">
                <a className="flex items-center" href="/board">
                  <img
                    alt="Pump"
                    src="/logofun.png"
                    width="30"
                    height="30"
                    loading="lazy"
                    decoding="async"
                    style={{ color: "transparent" }}
                  />
                </a>
                <div className="flex flex-col gap-2 ml-6">
                  <div className="flex gap-4">
                    <button
                      className="text-sm text-[#ef6401] hover:underline"
                      type="button"
                    >
                      [how it works]
                    </button>
                    <a
                      className="text-sm text-[#ef6401] hover:underline"
                      href="/advanced"
                    >
                      [advanced]
                    </a>
                  </div>
                  <div className="flex gap-4 items-center">
                    <a
                      className="text-sm hover:text-[#ef6401]"
                      href="https://t.me/pumpfunsupport"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaTelegramPlane size={16} />
                    </a>
                    <a
                      className="text-sm hover:text-[#ef6401]"
                      href="https://twitter.com/pumpdotfun"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaTwitter size={16} />
                    </a>
                    <a
                      className="text-sm hover:text-[#ef6401]"
                      href="https://www.instagram.com/pumpdotfun_/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaInstagram size={16} />
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <WalletMultiButton className="text-sm px-4 py-2 bg-[#ef6401] rounded text-white hover:bg-transparent hover:text-[#ef6401] border border-[#ef6401]" />
                <button
                  className="text-sm px-4 py-2 bg-[#ef6401] rounded text-white hover:bg-transparent hover:text-[#ef6401] border border-[#ef6401]"
                  onClick={() =>
                    setShowFavoritesWidget(!showFavoritesWidget)
                  }
                >
                  Favorites ({favorites.length})
                </button>
              </div>
            </nav>

            {/* Main Content */}
            <main className="h-full p-4">
              {/* Search and Filter */}
              <div className="mb-6 flex flex-wrap gap-4 items-center">
                <input
                  type="text"
                  placeholder={`Search tokens by ${filterBy}...`}
                  className="w-full max-w-md px-4 py-2 border border-[#ef6401] rounded bg-[#121726] text-white focus:outline-none"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(e.target.value)
                  }
                />
                <select
                  className="px-4 py-2 border border-[#ef6401] rounded bg-[#121726] text-white"
                  value={filterBy}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFilterBy(e.target.value as "name" | "symbol")
                  }
                >
                  <option value="name">Name</option>
                  <option value="symbol">Symbol</option>
                </select>
                <input
                  type="number"
                  placeholder="Min Market Cap"
                  className="px-4 py-2 border border-[#ef6401] rounded bg-[#121726] text-white"
                  value={minMarketCap}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMinMarketCap(e.target.value)
                  }
                />
                <input
                  type="number"
                  placeholder="Max Market Cap"
                  className="px-4 py-2 border border-[#ef6401] rounded bg-[#121726] text-white"
                  value={maxMarketCap}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMaxMarketCap(e.target.value)
                  }
                />
                <input
                  type="number"
                  placeholder="Min Initial Buy"
                  className="px-4 py-2 border border-[#ef6401] rounded bg-[#121726] text-white"
                  value={minInitialBuy}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMinInitialBuy(e.target.value)
                  }
                />
                <input
                  type="number"
                  placeholder="Max Initial Buy"
                  className="px-4 py-2 border border-[#ef6401] rounded bg-[#121726] text-white"
                  value={maxInitialBuy}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMaxInitialBuy(e.target.value)
                  }
                />
              </div>

              {/* Token Cards */}
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                ref={scrollRef}
              >
                {filteredTokens
                  .slice(0, visibleTokens)
                  .map((token: Token, index: number) => (
                    <div
                      key={index}
                      className="p-4 border border-[#ef6401] rounded bg-[#121726] relative"
                    >
                      <FaStar
                        className={`absolute top-2 right-2 text-2xl cursor-pointer ${
                          isFavorite(token)
                            ? "text-yellow-400"
                            : "text-gray-500"
                        }`}
                        onClick={() => toggleFavorite(token)}
                      />
                      <img
                        src={token.metadata?.image || "/placeholder.png"}
                        alt={token.metadata?.name || "Token Image"}
                        className="w-full h-48 object-cover rounded mb-4 cursor-pointer"
                        onClick={() =>
                          (window.location.href = `/coins/${token.mint}`)
                        }
                      />
                      <h3
                        className="text-lg font-bold text-[#ef6401] mb-2 cursor-pointer"
                        onClick={() =>
                          (window.location.href = `/coins/${token.mint}`)
                        }
                      >
                        {token.metadata?.name || "Unknown Token"} (
                        {token.metadata?.symbol || "N/A"})
                      </h3>
                      <p className="text-sm mb-1">
                        Market Cap:{" "}
                        {typeof token.marketCapSol === "number"
                          ? token.marketCapSol.toFixed(2)
                          : "N/A"}{" "}
                        SOL
                      </p>
                      <p className="text-sm mb-1">
                        Initial Buy:{" "}
                        {token.initialBuy !== undefined
                          ? token.initialBuy
                          : "N/A"}
                      </p>
                      <p className="text-sm mb-1">
                        Score: {calculateScore(token)}
                      </p>
                      <div className="flex gap-4 mt-2">
                        {token.metadata?.website && (
                          <a
                            href={token.metadata.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#ef6401] hover:underline"
                          >
                            Website
                          </a>
                        )}
                        {token.metadata?.telegram && (
                          <a
                            href={token.metadata.telegram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#ef6401] hover:underline"
                          >
                            Telegram
                          </a>
                        )}
                        {token.metadata?.twitter && (
                          <a
                            href={token.metadata.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#ef6401] hover:underline"
                          >
                            Twitter
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Loading Indicator */}
              {loading && (
                <div className="text-center text-[#ef6401] mt-4">
                  Loading more tokens...
                </div>
              )}
            </main>

            {/* Favorites Widget */}
            {showFavoritesWidget && (
              <div className="fixed top-0 right-0 w-80 h-full bg-[#1a1f2e] text-white shadow-lg z-50 overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b border-[#ef6401]">
                  <h2 className="text-lg font-bold text-[#ef6401]">
                    Favorites
                  </h2>
                  <IoClose
                    className="text-2xl cursor-pointer"
                    onClick={() => setShowFavoritesWidget(false)}
                  />
                </div>
                <div className="p-4">
                  {favorites.map((token: Token, index: number) => (
                    <div
                      key={index}
                      className="p-4 mb-4 border border-[#ef6401] rounded bg-[#121726]"
                    >
                      <h3 className="text-lg font-bold text-[#ef6401] mb-2">
                        {token.metadata?.name || "Unknown Token"} (
                        {token.metadata?.symbol || "N/A"})
                      </h3>
                      <p className="text-sm mb-1">
                        Market Cap:{" "}
                        {typeof token.marketCapSol === "number"
                          ? token.marketCapSol.toFixed(2)
                          : "N/A"}{" "}
                        SOL
                      </p>
                      <p className="text-sm">
                        {token.metadata?.description
                          ? `${token.metadata.description.slice(0, 120)}...`
                          : "No description available"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default Home;
