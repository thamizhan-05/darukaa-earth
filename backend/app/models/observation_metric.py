from __future__ import annotations

import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MetricType(str, enum.Enum):
    CARBON_STOCK = "CARBON_STOCK"
    CARBON_SEQUESTRATION = "CARBON_SEQUESTRATION"
    BIODIVERSITY_INDEX = "BIODIVERSITY_INDEX"
    NDVI = "NDVI"
    TREE_DENSITY = "TREE_DENSITY"
    SPECIES_COUNT = "SPECIES_COUNT"
    CANOPY_COVER = "CANOPY_COVER"
    SOIL_CARBON = "SOIL_CARBON"
    WATER_QUALITY = "WATER_QUALITY"


class ObservationMetric(Base):
    __tablename__ = "observation_metrics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    observation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("observations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    metric_type: Mapped[MetricType] = mapped_column(
        Enum(MetricType, name="metric_type_enum"), nullable=False, index=True
    )
    value: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False)
    unit: Mapped[str | None] = mapped_column(String(50))

    # Relationships
    observation: Mapped[Observation] = relationship(  # noqa: F821
        "Observation", back_populates="metrics"
    )
