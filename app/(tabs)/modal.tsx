import { KeyboardAvoidingView, ModalProps, Modal as RNModal, StyleSheet, View } from "react-native";
 
type PROPS = ModalProps & { isOpen: boolean, withInput: boolean };
 
export const Modal = ({ isOpen, withInput, children, ...rest }: PROPS) => {
  const content = withInput ? (
<KeyboardAvoidingView style={styles.centeredContainer}>
<View style={styles.modalContent}>
        {children}
</View>
</KeyboardAvoidingView>
  ) : (
<View style={styles.centeredContainer}>
<View style={styles.modalContent}>
        {children}
</View>
</View>
  );
 
  return (
<RNModal
      visible={isOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      {...rest}
>
      {content}
</RNModal>
  );
};
 
const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
  },
});