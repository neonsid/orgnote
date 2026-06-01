import { Ionicons } from '@expo/vector-icons'
import { Text, View } from 'react-native'

import { useAppTheme } from '@/contexts/app-theme'
import { cn } from '@/lib/cn'

import { AppPressable } from './app-pressable'

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress: () => void
  destructive?: boolean
  disabled?: boolean
  trailing?: React.ReactNode
}

export function MenuItem({
  icon,
  label,
  onPress,
  destructive = false,
  disabled = false,
  trailing,
}: MenuItemProps) {
  const { colors } = useAppTheme()

  return (
    <AppPressable
      className={cn(
        'flex-row items-center gap-3 rounded-lg px-3 py-2.5 active:bg-accent',
        disabled && 'opacity-45'
      )}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons
        name={icon}
        size={18}
        color={destructive ? colors.error : colors.textSecondary}
      />
      <Text
        className={cn(
          'flex-1 font-sans text-base text-foreground',
          destructive && 'text-destructive'
        )}
      >
        {label}
      </Text>
      {trailing}
    </AppPressable>
  )
}

export function MenuSeparator() {
  return <View className="my-1 h-px bg-border" />
}

export function MenuSubTrigger({
  icon,
  label,
  expanded,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  expanded: boolean
  onPress: () => void
}) {
  const { colors } = useAppTheme()

  return (
    <AppPressable
      className="flex-row items-center gap-3 rounded-lg px-3 py-2.5 active:bg-accent"
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={18}
        color={colors.textSecondary}
        style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
      />
      <Text className="flex-1 font-sans text-base text-foreground">
        {label}
      </Text>
    </AppPressable>
  )
}

export function MenuSubItem({
  label,
  dotColor,
  onPress,
}: {
  label: string
  dotColor: string
  onPress: () => void
}) {
  return (
    <AppPressable
      className="flex-row items-center gap-3 rounded-lg py-2.5 pl-8 pr-3 active:bg-accent"
      onPress={onPress}
    >
      <View
        className="size-2 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      <Text
        className="min-w-0 flex-1 font-sans text-base text-foreground"
        numberOfLines={1}
      >
        {label}
      </Text>
    </AppPressable>
  )
}

export function MenuGroup({ children }: { children: React.ReactNode }) {
  return <View className="py-1.5">{children}</View>
}
