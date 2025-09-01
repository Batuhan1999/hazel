import { Schema } from "effect"
import * as Model from "../services/model"

export const baseFields = {
	createdAt: Model.Generated(Schema.Date),
	updatedAt: Model.Generated(Schema.NullOr(Schema.Date)),
	deletedAt: Model.GeneratedByApp(Schema.NullOr(Schema.Date)),
}
