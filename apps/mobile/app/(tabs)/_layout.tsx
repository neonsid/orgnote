import { Ionicons } from "@expo/vector-icons";
import {
  createMaterialTopTabNavigator,
  MaterialTopTabBar,
  type MaterialTopTabNavigationEventMap,
  type MaterialTopTabNavigationOptions,
} from "@react-navigation/material-top-tabs";
import type { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/contexts/app-theme";

const { Navigator } = createMaterialTopTabNavigator();
const SwipeableTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const bottomInset = Math.max(insets.bottom, Platform.OS === "android" ? 12 : 0);
  const tabBarHeight = 30 + bottomInset + 6;

  return (
    <SwipeableTabs
      tabBar={(props) => (
        <View
          style={[
            styles.tabBarContainer,
            {
              backgroundColor: colors.tabBarBg,
              borderTopColor: colors.tabBarBorder,
              paddingBottom: bottomInset + 6,
              minHeight: tabBarHeight,
            },
          ]}
        >
          <MaterialTopTabBar {...props} />
        </View>
      )}
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          paddingTop: 6,
          minHeight: tabBarHeight,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIndicatorStyle: {
          backgroundColor: "transparent",
          height: 0,
        },
        tabBarPressColor: "transparent",
        tabBarShowIcon: true,
        tabBarBounces: false,
        sceneStyle: {
          backgroundColor: colors.background,
          paddingBottom: tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          textTransform: "none",
        },
        tabBarItemStyle: {
          minHeight: 48,
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
              size={22}
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
              size={22}
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
              size={22}
              color={color}
            />
          ),
        }}
      />
    </SwipeableTabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
});
