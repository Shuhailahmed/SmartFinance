import { useEffect, useState } from "react";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Receipt,
  Wallet,
  Target,
  Tags,
  Loader2,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import notificationService from "../../services/notificationService";
import searchService from "../../services/searchService";

const UserNavbar = ({ onMenuClick }) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    transactions: [],
    budgets: [],
    savingsGoals: [],
    categories: [],
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Load notification count
  const loadUnreadCount = async () => {
    if (!token) return;

    try {
      const response = await notificationService.getUnreadCount(token);

      if (response.success) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error("Failed to load notification count:", error);
    }
  };

  useEffect(() => {
    if (!token) return;

    loadUnreadCount();

    const interval = setInterval(loadUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [token]);

  // Global search with debounce
  useEffect(() => {
    const query = searchQuery.trim();

    if (query.length < 2) {
      setSearchResults({
        transactions: [],
        budgets: [],
        savingsGoals: [],
        categories: [],
      });
      setSearchLoading(false);
      setSearchError("");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError("");

        const response = await searchService.globalSearch(query);

        if (response.success) {
          setSearchResults({
            transactions: response.results?.transactions || [],
            budgets: response.results?.budgets || [],
            savingsGoals: response.results?.savingsGoals || [],
            categories: response.results?.categories || [],
          });
        } else {
          setSearchError("Unable to search. Please try again.");
        }
      } catch (error) {
        console.error("Global search failed:", error);
        setSearchError(
          error.response?.data?.message || "Search failed. Please try again.",
        );
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check whether results exist
  const hasResults =
    searchResults.transactions.length > 0 ||
    searchResults.budgets.length > 0 ||
    searchResults.savingsGoals.length > 0 ||
    searchResults.categories.length > 0;

  // Navigate to result
  const handleResultClick = (path) => {
    navigate(path);
    setSearchQuery("");
    setIsSearchOpen(false);
    setMobileSearchOpen(false);
  };

  // Format currency
  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return "";

    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };

  // Search result item
  const SearchResult = ({ icon: Icon, title, subtitle, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-100"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">{title}</p>

        {subtitle && (
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
    </button>
  );

  // Search dropdown
  const SearchDropdown = () => (
    <div className="absolute left-0 top-full z-50 mt-2 max-h-[450px] w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
      {searchQuery.trim().length < 2 ? (
        <p className="px-3 py-5 text-center text-sm text-slate-500">
          Type at least 2 characters to search
        </p>
      ) : searchLoading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          Searching...
        </div>
      ) : searchError ? (
        <p className="px-3 py-5 text-center text-sm text-red-500">
          {searchError}
        </p>
      ) : !hasResults ? (
        <div className="py-6 text-center">
          <Search size={25} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">No results found</p>
          <p className="mt-1 text-xs text-slate-500">
            Try searching with another keyword.
          </p>
        </div>
      ) : (
        <>
          {/* Transactions */}
          {searchResults.transactions.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Transactions
              </p>

              {searchResults.transactions.map((item) => (
                <SearchResult
                  key={item._id}
                  icon={Receipt}
                  title={item.description || item.category || "Transaction"}
                  subtitle={`${item.category || ""} ${
                    item.amount !== undefined
                      ? `• ${formatAmount(item.amount)}`
                      : ""
                  }`}
                  onClick={() => handleResultClick("/transactions")}
                />
              ))}
            </div>
          )}

          {/* Budgets */}
          {searchResults.budgets.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Budgets
              </p>

              {searchResults.budgets.map((item) => (
                <SearchResult
                  key={item._id}
                  icon={Wallet}
                  title={item.category || "Budget"}
                  subtitle={`${formatAmount(item.amount)} • ${
                    item.month || ""
                  } ${item.year || ""}`}
                  onClick={() => handleResultClick("/budgets")}
                />
              ))}
            </div>
          )}

          {/* Savings Goals */}
          {searchResults.savingsGoals.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Savings Goals
              </p>

              {searchResults.savingsGoals.map((item) => (
                <SearchResult
                  key={item._id}
                  icon={Target}
                  title={item.name || "Savings Goal"}
                  subtitle={`Saved ${formatAmount(
                    item.savedAmount,
                  )} of ${formatAmount(item.targetAmount)}`}
                  onClick={() => handleResultClick("/savings-goals")}
                />
              ))}
            </div>
          )}

          {/* Categories */}
          {searchResults.categories.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Categories
              </p>

              {searchResults.categories.map((category, index) => (
                <SearchResult
                  key={`${category}-${index}`}
                  icon={Tags}
                  title={category}
                  subtitle="View transactions in this category"
                  onClick={() =>
                    handleResultClick(
                      `/transactions?category=${encodeURIComponent(category)}`,
                    )
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-8">
      {/* Left Side */}
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        {/* Desktop Search */}
        <div className="relative hidden w-[420px] md:block">
          <div className="flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-2.5 focus-within:ring-2 focus-within:ring-green-100">
            <Search size={19} className="shrink-0 text-slate-400" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsSearchOpen(false);
                }
              }}
              placeholder="Search transactions, budgets, savings..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {isSearchOpen && <SearchDropdown />}
        </div>

        {/* Mobile Search Input */}
        {mobileSearchOpen && (
          <div className="relative flex-1 md:hidden">
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5">
              <Search size={18} className="text-slate-400" />

              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search..."
                className="w-full bg-transparent text-sm outline-none"
              />

              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(false);
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
                aria-label="Close search"
              >
                <X size={17} />
              </button>
            </div>

            {isSearchOpen && <SearchDropdown />}
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className="ml-2 flex shrink-0 items-center gap-2 sm:gap-4">
        {/* Mobile Search Button */}
        {!mobileSearchOpen && (
          <button
            onClick={() => {
              setMobileSearchOpen(true);
              setIsSearchOpen(true);
            }}
            className="rounded-lg p-2 hover:bg-slate-100 md:hidden"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
        )}

        {/* Notifications */}
        <Link
          to="/notifications"
          className="relative flex h-11 w-11 items-center justify-center rounded-xl transition hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell size={21} />

          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile */}
        <Link
          to="/profile"
          className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
          aria-label="Profile and Settings"
        >
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-green-100 bg-green-100">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user?.name || "User"}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-green-700">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-slate-900">
              {user?.name || "User"}
            </p>

            <p className="text-xs text-slate-500">Personal Account</p>
          </div>

          <ChevronDown size={17} className="hidden text-slate-500 sm:block" />
        </Link>
      </div>
    </header>
  );
};

export default UserNavbar;
