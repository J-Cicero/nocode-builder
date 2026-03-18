# schema_builder imports models from schema module
# to avoid duplicate table definitions
from app.modules.schema.models import (
    Schema,
    TableSchema,
    Field,
    Relation,
    FieldType,
    RelationType,
)
