import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  createMaterialTopTabNavigator,
  MaterialTopTabBar,
  type MaterialTopTabBarProps,
  type MaterialTopTabNavigationEventMap,
  type MaterialTopTabNavigationOptions,
} from "@react-navigation/material-top-tabs";
import type { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/contexts/app-theme";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import { TAB_BAR_CONTENT_HEIGHT } from "@/lib/constants";

const { Navigator } = createMaterialTopTabNavigator();
const SwipeableTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

function TabBarWithPill(props: MaterialTopTabBarProps) {
  const { state } = props;
  const { colors } = useAppTheme();

  return (
    <View className="relative overflow-visible px-2">
      <View
        pointerEvents="none"
        className="absolute bottom-1 left-2 right-2 top-1 flex-row"
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          if (!focused) return <View key={route.key} className="flex-1" />;
          return (
            <View key={route.key} className="flex-1 items-center justify-center px-1">
              <View
                className="h-full w-full rounded-xl"
                style={{ backgroundColor: colors.tabBarActive }}
              />
            </View>
          );
        })}
      </View>
      <MaterialTopTabBar {...props} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const tabBarHeight = useTabBarHeight();
  const bottomInset = Math.max(insets.bottom, Platform.OS === "android" ? 10 : 0);

  return (
    <SwipeableTabs
      tabBar={(props) => (
        <View
          className="absolute bottom-0 left-0 right-0 overflow-hidden"
          style={{
            paddingBottom: bottomInset,
            height: tabBarHeight,
            zIndex: 100,
            elevation: 24,
          }}
        >
          <BlurView
            intensity={Platform.OS === "ios" ? 90 : 72}
            tint="dark"
            experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
            style={StyleSheet.absoluteFillObject}
          />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor:
                  Platform.OS === "ios" ? "rgba(0, 0, 0, 0.18)" : "rgba(0, 0, 0, 0.28)",
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: "rgba(255, 255, 255, 0.1)",
              },
            ]}
          />
          <TabBarWithPill {...props} />
        </View>
      )}
      screenListeners={{
        tabPress: () => {
          if (Platform.OS !== "web") {
            void Haptics.selectionAsync();
          }
        },
      }}
      screenOptions={{
        lazy: true,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: "transparent",
          height: TAB_BAR_CONTENT_HEIGHT,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIndicatorStyle: {
          backgroundColor: "transparent",
          height: 0,
        },
        tabBarPressColor: "transparent",
        tabBarShowIcon: true,
        tabBarShowLabel: true,
        tabBarBounces: false,
        sceneStyle: {
          backgroundColor: colors.background,
          paddingBottom: tabBarHeight,
        },
        tabBarLabelStyle: {
          fontFamily: "Poppins_500Medium",
          fontSize: 10,
          fontWeight: "500",
          textTransform: "none",
          marginTop: 2,
        },
        tabBarItemStyle: {
          height: TAB_BAR_CONTENT_HEIGHT,
          paddingVertical: 0,
        },
        swipeEnabled: true,
      }}
    >
      <SwipeableTabs.Screen
        name="index"
        options={{
          title: "Bookmarks",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "bookmark" : "bookmark-outline"}
              size={21}
              color={color}
            />
          ),
        }}
      />
      <SwipeableTabs.Screen
        name="vault"
        options={{
          title: "Vault",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "folder" : "folder-outline"}
              size={21}
              color={color}
            />
          ),
        }}
      />
      <SwipeableTabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={21}
              color={color}
            />
          ),
        }}
      />
    </SwipeableTabs>
  );
}
