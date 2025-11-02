import { twMerge } from "tailwind-merge"

export interface AvatarProps {
	src?: string | null
	initials?: string
	alt?: string
	className?: string
	isSquare?: boolean
	status?: "online" | "offline"
	size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "8xl" | "9xl"
}

const statusIndicatorSizes = {
	xs: "size-1.5",
	sm: "size-2",
	md: "size-2.5",
	lg: "size-3",
	xl: "size-3.5",
	"2xl": "size-4",
	"3xl": "size-4.5",
	"4xl": "size-5",
	"5xl": "size-5.5",
	"6xl": "size-6",
	"7xl": "size-6.5",
	"8xl": "size-7",
	"9xl": "size-7.5",
}

export function Avatar({
	src = null,
	isSquare = false,
	size = "md",
	initials,
	alt = "",
	status,
	className,
	...props
}: AvatarProps & React.ComponentPropsWithoutRef<"span">) {
	return (
		<span
			data-slot="avatar"
			{...props}
			className={twMerge(
				"-outline-offset-1 relative inline-grid size-(--avatar-size) shrink-0 align-middle outline-1 outline-fg/(--ring-opacity) [--avatar-radius:20%] [--ring-opacity:20%] *:col-start-1 *:row-start-1 *:size-(--avatar-size)",
				size === "xs" && "[--avatar-size:--spacing(5)]",
				size === "sm" && "[--avatar-size:--spacing(6)]",
				size === "md" && "[--avatar-size:--spacing(8)]",
				size === "lg" && "[--avatar-size:--spacing(10)]",
				size === "xl" && "[--avatar-size:--spacing(12)]",
				size === "2xl" && "[--avatar-size:--spacing(14)]",
				size === "3xl" && "[--avatar-size:--spacing(16)]",
				size === "4xl" && "[--avatar-size:--spacing(20)]",
				size === "5xl" && "[--avatar-size:--spacing(24)]",
				size === "6xl" && "[--avatar-size:--spacing(28)]",
				size === "7xl" && "[--avatar-size:--spacing(32)]",
				size === "8xl" && "[--avatar-size:--spacing(36)]",
				size === "9xl" && "[--avatar-size:--spacing(42)]",
				isSquare
					? "rounded-(--avatar-radius) *:rounded-(--avatar-radius)"
					: "rounded-full *:rounded-full",
				className,
			)}
		>
			{initials && (
				<svg
					className="size-full select-none fill-current p-[5%] font-md text-[48px] uppercase"
					viewBox="0 0 100 100"
					aria-hidden={alt ? undefined : "true"}
				>
					{alt && <title>{alt}</title>}
					<text
						x="50%"
						y="50%"
						alignmentBaseline="middle"
						dominantBaseline="middle"
						textAnchor="middle"
						dy=".125em"
					>
						{initials}
					</text>
				</svg>
			)}
			{src && <img className="size-full object-cover object-center" src={src} alt={alt} />}
			{status && (
				<span
					className={twMerge(
						"absolute right-0 bottom-0 rounded-full ring-[1.5px] ring-white",
						status === "online" ? "bg-green-500" : "bg-gray-400",
						statusIndicatorSizes[size],
					)}
				/>
			)}
		</span>
	)
}
