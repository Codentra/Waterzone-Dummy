import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { colors } from "@/constants/theme";
import { uploadFileToConvex } from "@/lib/uploadDocument";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

type DocKey =
  | "nationalIdFrontId"
  | "nationalIdBackId"
  | "driversLicenseId"
  | "policeClearanceId"
  | "vehicleRegistrationId"
  | "proofOfAddressId"
  | "profilePhotoId"
  | "vehicleInsuranceId"
  | "vehicleAuthorizationId";

const REQUIRED_DOCS: { key: DocKey; label: string }[] = [
  { key: "nationalIdFrontId", label: "National ID (front)" },
  { key: "nationalIdBackId", label: "National ID (back)" },
  { key: "driversLicenseId", label: "Driver's license" },
  { key: "policeClearanceId", label: "Police clearance" },
  { key: "vehicleRegistrationId", label: "Vehicle registration" },
  { key: "proofOfAddressId", label: "Proof of address" },
  { key: "profilePhotoId", label: "Profile photo (selfie)" },
];

const OPTIONAL_DOCS: { key: DocKey; label: string }[] = [
  { key: "vehicleInsuranceId", label: "Vehicle insurance (optional)" },
  { key: "vehicleAuthorizationId", label: "Vehicle authorization letter (optional)" },
];

export default function DriverRegisterScreen() {
  const router = useRouter();
  const { auth } = useAuth();
  const registerDriver = useMutation(api.drivers.registerDriver);
  const generateUploadUrl = useMutation(api.drivers.generateUploadUrl);

  const [nationalIdNumber, setNationalIdNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleMakeModel, setVehicleMakeModel] = useState("");
  const [tankCapacityLitres, setTankCapacityLitres] = useState("");
  const [vehicleColour, setVehicleColour] = useState("");
  const [docPreviews, setDocPreviews] = useState<Partial<Record<DocKey, string>>>({});
  const [docStorageIds, setDocStorageIds] = useState<Partial<Record<DocKey, string>>>({});
  const [uploadingKey, setUploadingKey] = useState<DocKey | null>(null);
  const [loading, setLoading] = useState(false);

  const uploadDoc = async (key: DocKey, uri: string, mimeType: string) => {
    if (!auth?.userId) throw new Error("Not signed in");
    setUploadingKey(key);
    try {
      const storageId = await uploadFileToConvex(
        () => generateUploadUrl({ userId: auth.userId as any }),
        uri,
        mimeType
      );
      setDocStorageIds((prev) => ({ ...prev, [key]: storageId }));
      setDocPreviews((prev) => ({ ...prev, [key]: uri }));
    } finally {
      setUploadingKey(null);
    }
  };

  const pickPhoto = async (key: DocKey) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow camera access to upload documents.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      await uploadDoc(key, result.assets[0].uri, result.assets[0].mimeType ?? "image/jpeg");
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again");
    }
  };

  const pickGallery = async (key: DocKey) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      await uploadDoc(key, result.assets[0].uri, result.assets[0].mimeType ?? "image/jpeg");
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again");
    }
  };

  const pickFile = async (key: DocKey) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      await uploadDoc(
        key,
        result.assets[0].uri,
        result.assets[0].mimeType ?? "application/pdf"
      );
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again");
    }
  };

  const allRequiredDocs = REQUIRED_DOCS.every((d) => docStorageIds[d.key]);

  const handleSubmit = async () => {
    if (!auth?.userId) {
      Alert.alert("Error", "Not signed in.");
      return;
    }
    const plate = vehiclePlate.trim();
    const type = vehicleType.trim();
    const capacity = Number(tankCapacityLitres);
    if (!plate || !type || !vehicleMakeModel.trim()) {
      Alert.alert("Missing fields", "Complete all vehicle fields.");
      return;
    }
    if (!Number.isFinite(capacity) || capacity <= 0) {
      Alert.alert("Invalid capacity", "Enter tank capacity in litres.");
      return;
    }
    if (!allRequiredDocs) {
      Alert.alert("Documents required", "Upload all required documents before submitting.");
      return;
    }

    setLoading(true);
    try {
      await registerDriver({
        userId: auth.userId as any,
        vehiclePlate: plate,
        vehicleType: type,
        profile: {
          nationalIdNumber: nationalIdNumber.trim(),
          dateOfBirth: dateOfBirth.trim(),
          homeAddress: homeAddress.trim(),
          emergencyContactName: emergencyContactName.trim(),
          emergencyContactPhone: emergencyContactPhone.trim(),
          vehicleMakeModel: vehicleMakeModel.trim(),
          tankCapacityLitres: capacity,
          vehicleColour: vehicleColour.trim() || undefined,
        },
        documents: {
          nationalIdFrontId: docStorageIds.nationalIdFrontId as any,
          nationalIdBackId: docStorageIds.nationalIdBackId as any,
          driversLicenseId: docStorageIds.driversLicenseId as any,
          policeClearanceId: docStorageIds.policeClearanceId as any,
          vehicleRegistrationId: docStorageIds.vehicleRegistrationId as any,
          proofOfAddressId: docStorageIds.proofOfAddressId as any,
          profilePhotoId: docStorageIds.profilePhotoId as any,
          vehicleInsuranceId: docStorageIds.vehicleInsuranceId as any,
          vehicleAuthorizationId: docStorageIds.vehicleAuthorizationId as any,
        },
      });
      router.replace("/driver/register-pending");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const renderDocSlot = (doc: { key: DocKey; label: string }, optional = false) => (
    <View key={doc.key} style={styles.docSlot}>
      <Text style={styles.docLabel}>
        {doc.label}
        {!optional && <Text style={styles.required}> *</Text>}
      </Text>
      {docPreviews[doc.key] ? (
        <Image source={{ uri: docPreviews[doc.key]! }} style={styles.docPreview} />
      ) : null}
      <View style={styles.docActions}>
        <TouchableOpacity
          style={styles.docBtn}
          disabled={uploadingKey === doc.key}
          onPress={() => pickPhoto(doc.key)}
        >
          <Text style={styles.docBtnText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.docBtn}
          disabled={uploadingKey === doc.key}
          onPress={() => pickGallery(doc.key)}
        >
          <Text style={styles.docBtnText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.docBtn}
          disabled={uploadingKey === doc.key}
          onPress={() => pickFile(doc.key)}
        >
          <Text style={styles.docBtnText}>File</Text>
        </TouchableOpacity>
      </View>
      {uploadingKey === doc.key ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
      ) : docStorageIds[doc.key] ? (
        <Text style={styles.uploaded}>Uploaded</Text>
      ) : null}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Driver registration</Text>
      <Text style={styles.subtitle}>
        Submit your profile and documents for admin approval before you can go online.
      </Text>

      <Text style={styles.section}>Personal details</Text>
      <TextInput style={styles.input} placeholder="National ID number" value={nationalIdNumber} onChangeText={setNationalIdNumber} />
      <TextInput style={styles.input} placeholder="Date of birth (YYYY-MM-DD)" value={dateOfBirth} onChangeText={setDateOfBirth} />
      <TextInput style={styles.input} placeholder="Home address" value={homeAddress} onChangeText={setHomeAddress} multiline />
      <TextInput style={styles.input} placeholder="Emergency contact name" value={emergencyContactName} onChangeText={setEmergencyContactName} />
      <TextInput style={styles.input} placeholder="Emergency contact phone" value={emergencyContactPhone} onChangeText={setEmergencyContactPhone} keyboardType="phone-pad" />

      <Text style={styles.section}>Vehicle</Text>
      <TextInput style={styles.input} placeholder="Vehicle plate" value={vehiclePlate} onChangeText={setVehiclePlate} />
      <TextInput style={styles.input} placeholder="Vehicle type (truck, bowser, van)" value={vehicleType} onChangeText={setVehicleType} />
      <TextInput style={styles.input} placeholder="Make & model" value={vehicleMakeModel} onChangeText={setVehicleMakeModel} />
      <TextInput style={styles.input} placeholder="Tank capacity (litres)" value={tankCapacityLitres} onChangeText={setTankCapacityLitres} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Vehicle colour (optional)" value={vehicleColour} onChangeText={setVehicleColour} />

      <Text style={styles.section}>Documents</Text>
      {REQUIRED_DOCS.map((d) => renderDocSlot(d))}
      {OPTIONAL_DOCS.map((d) => renderDocSlot(d, true))}

      <TouchableOpacity
        style={[styles.button, (loading || !allRequiredDocs) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading || !allRequiredDocs}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Submit for approval</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  section: { fontSize: 16, fontWeight: "700", marginTop: 8, marginBottom: 12, color: colors.primary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  docSlot: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  docLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  required: { color: "#dc2626" },
  docPreview: { width: "100%", height: 120, borderRadius: 8, marginBottom: 8 },
  docActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  docBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#e0f2fe",
  },
  docBtnText: { color: colors.primaryDark, fontWeight: "600", fontSize: 13 },
  uploaded: { marginTop: 6, fontSize: 12, color: "#16a34a", fontWeight: "600" },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
