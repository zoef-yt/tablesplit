"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxProps {
	value: string;
	onChange: (value: string) => void;
	options: string[];
	placeholder?: string;
	className?: string;
}

export function Combobox({
	value,
	onChange,
	options,
	placeholder = "Select or type...",
	className,
}: ComboboxProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [inputValue, setInputValue] = useState(value);
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Filter options based on input
	const filteredOptions = options.filter((option) =>
		option.toLowerCase().includes(inputValue.toLowerCase())
	);

	// Close on click outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Sync input value with prop value
	useEffect(() => {
		setInputValue(value);
	}, [value]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setInputValue(newValue);
		onChange(newValue);
		setIsOpen(true);
	};

	const handleOptionSelect = (option: string) => {
		setInputValue(option);
		onChange(option);
		setIsOpen(false);
		inputRef.current?.blur();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			setIsOpen(false);
			inputRef.current?.blur();
		} else if (e.key === "Enter" && filteredOptions.length > 0) {
			e.preventDefault();
			handleOptionSelect(filteredOptions[0]);
		}
	};

	return (
		<div ref={containerRef} className="relative">
			<div className="relative">
				<input
					ref={inputRef}
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					onFocus={() => setIsOpen(true)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					className={cn(
						"flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 pr-10",
						className
					)}
				/>
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
				>
					<ChevronDown
						className={cn(
							"w-4 h-4 transition-transform",
							isOpen && "rotate-180"
						)}
					/>
				</button>
			</div>

			<AnimatePresence>
				{isOpen && filteredOptions.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.15 }}
						className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
					>
						<div className="max-h-60 overflow-y-auto py-1">
							{filteredOptions.map((option) => (
								<button
									key={option}
									type="button"
									onClick={() => handleOptionSelect(option)}
									className={cn(
										"w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-700 transition-colors",
										option === value
											? "text-primary-400 bg-gray-700/50"
											: "text-gray-300"
									)}
								>
									{option}
									{option === value && (
										<Check className="w-4 h-4 text-primary-400" />
									)}
								</button>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// Predefined category options
export const EXPENSE_CATEGORIES = [
	"Food & Drinks",
	"Groceries",
	"Restaurant",
	"Transport",
	"Uber/Ola",
	"Fuel",
	"Rent",
	"Utilities",
	"Electricity",
	"Internet",
	"Shopping",
	"Entertainment",
	"Movies",
	"Travel",
	"Hotel",
	"Flight",
	"Medical",
	"Subscriptions",
	"Gifts",
	"Party",
	"Sports",
	"Education",
	"Other",
];
