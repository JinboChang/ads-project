# 데이터베이스 블루프린트

## 1. 설계 목적
- 블로컬 체험단 SaaS에서 확정된 유저플로우(회원가입→역할별 온보딩→체험 모집·신청·선정)를 안정적으로 저장하고 추적하기 위한 최소 데이터 모델.
- 인플루언서와 광고주가 입력하는 핵심 정보, 체험 모집 정보, 신청·선정 히스토리만을 다루며 그 외 확장 데이터는 포함하지 않음.

## 2. 데이터 플로우 요약 (DB 관점)
### 2.1 인플루언서 여정
1. **회원가입 & 권한선택**: 입력(이름, 휴대폰, 이메일, 인증 방식, 역할) → Supabase Auth 계정 생성 → `profiles`에 기본 정보 저장.
2. **인플루언서 정보 등록**: 생년월일 입력 → `influencer_profiles` 저장 → 채널 추가 시 `influencer_channels`에 플랫폼·URL 기록 → 검증 결과로 `verification_status` 갱신.
3. **체험 탐색**: `campaigns` 조회로 모집 중 체험 카드 목록 획득.
4. **체험 상세 확인**: 선택한 캠페인의 상세 정보(`campaigns` + 신청 집계)를 읽어 권한 확인.
5. **체험 지원**: 각오 한마디·방문 예정일 입력 → `applications`에 신규 신청 생성(중복 방지) → `application_events`에 제출 로그 기록.
6. **지원 현황 확인**: 본인 신청 내역을 `applications`에서 상태별로 조회, 이벤트 로그로 변화 추적.

### 2.2 광고주 여정
1. **회원가입 & 권한선택**: 기본 정보 입력 → `profiles` 저장 → 광고주 세부 입력 화면으로 이동.
2. **광고주 정보 등록**: 상호·카테고리·사업자등록번호·위치 입력 → `advertiser_profiles` 레코드 생성 → 검증 상태 업데이트.
3. **체험 모집 생성**: 체험명, 모집 기간, 혜택, 미션, 매장, 모집 인원 입력 → `campaigns`에 저장, 기본 상태는 `recruiting`.
4. **모집 현황 모니터링**: `applications`에서 캠페인별 신청자 목록·상태 조회.
5. **모집 종료 및 선정**: 캠페인 종료 시 `campaigns.status`를 `recruitment_closed`로 변경 → 선정/반려 시 대상 신청의 `applications.status` 갱신 및 `application_events`에 기록.

## 3. 테이블 관계 개요
- `profiles`는 Supabase Auth 사용자(`auth.users`)와 1:1로 매핑되고, 역할에 따라 인플루언서/광고주 세부 정보 테이블과 연결됨.
- `influencer_profiles` ↔ `influencer_channels`는 1:N 관계로 채널 목록과 검증 상태를 관리함.
- `advertiser_profiles` ↔ `campaigns`는 1:N 관계로 광고주가 생성한 체험 모집을 저장함.
- `campaigns` ↔ `applications`는 1:N 관계로 체험 신청을 추적하며, 신청 상태 변경 기록은 `application_events`에 1:N으로 저장됨.

## 4. 테이블 상세 정의
### 4.1 `public.profiles`
- `user_id uuid` (PK, FK → `auth.users.id`, CASCADE 삭제)
- `role_type text` (`influencer`/`advertiser`), 역할 기반 온보딩 분기
- `full_name text`, `phone text`
- `verification_method text` (`email`/`sms`), 입력 검증 방식 추적
- `onboarding_status text` (`pending`/`completed`)
- `created_at timestamptz`, `updated_at timestamptz` + 갱신 트리거

### 4.2 `public.influencer_profiles`
- `influencer_id uuid` (PK, FK → `profiles.user_id`)
- `birth_date date`
- `verification_status text` (`pending`/`approved`/`rejected`)
- `verification_notes text`
- 타임스탬프 + 갱신 트리거

### 4.3 `public.influencer_channels`
- `id bigserial` (PK)
- `influencer_id uuid` (FK → `influencer_profiles.influencer_id`)
- `platform text` (`youtube`/`instagram`/`naver`/`threads`/`tiktok`)
- `channel_name text`, `channel_url text`
- `verification_status text` (`pending`/`approved`/`rejected`), `last_verified_at timestamptz`
- 중복 방지: UNIQUE(`influencer_id`,`platform`,`channel_url`)
- 타임스탬프 + 갱신 트리거

### 4.4 `public.advertiser_profiles`
- `advertiser_id uuid` (PK, FK → `profiles.user_id`)
- `company_name text`, `business_category text`, `location text`
- `business_reg_number text` (UNIQUE)
- `verification_status text` (`pending`/`approved`/`rejected`), `verification_notes text`
- 타임스탬프 + 갱신 트리거

### 4.5 `public.campaigns`
- `id bigserial` (PK)
- `advertiser_id uuid` (FK → `advertiser_profiles.advertiser_id`)
- `title text`
- `application_start_at timestamptz`, `application_end_at timestamptz` (시작 < 종료 체크)
- `benefit_summary text`, `mission_details text`, `store_location text`
- `max_participants integer` (>0)
- `status text` (`draft`/`recruiting`/`recruitment_closed`/`completed`)
- 타임스탬프 + 갱신 트리거, 인덱스(`advertiser_id`,`status`)

### 4.6 `public.applications`
- `id bigserial` (PK)
- `campaign_id bigint` (FK → `campaigns.id`)
- `influencer_id uuid` (FK → `influencer_profiles.influencer_id`)
- `motivation_note text`, `planned_visit_on date`
- `status text` (`submitted`/`approved`/`rejected`/`cancelled`)
- `submitted_at timestamptz`, `status_updated_at timestamptz`
- UNIQUE(`campaign_id`,`influencer_id`)로 중복 지원 차단
- 인덱스: (`influencer_id`,`status`), (`campaign_id`,`status`)
- 타임스탬프 + 갱신 트리거, 상태 변경 시 `status_updated_at` 자동 갱신 트리거

### 4.7 `public.application_events`
- `id bigserial` (PK)
- `application_id bigint` (FK → `applications.id`)
- `performed_by uuid` (FK → `profiles.user_id`)
- `event_type text` (`submitted`/`status_changed`/`note_added`)
- `from_status text`, `to_status text`
- `context jsonb`
- `recorded_at timestamptz`
- 인덱스: (`application_id`,`recorded_at DESC`)
- 타임스탬프 + 갱신 트리거 (수정 시 추적)

## 5. 상태 및 무결성 전략
- 역할별 온보딩: `profiles.role_type` + `onboarding_status`로 진행 상황 제어.
- 검증 단계: 각 역할 세부 프로필의 `verification_status`로 서비스 접근 권한을 분기.
- 모집 상태: `campaigns.status`로 공개/종료 흐름을 통제하며, 종료 시 신규 `applications` 생성 로직에서 기간·상태를 검사.
- 신청 상태: `applications.status` + `status_updated_at`으로 현재 결정과 최근 변경 시점을 기록하고, 모든 변화는 `application_events`에 남겨 감사 로그를 충족.

## 6. 확장 및 운영 메모
- 본 스키마는 유저플로우에 등장하는 데이터만 포함하며, 광고 소재·정산 등 추가 요구는 별도 테이블로 확장 예정.
- 모든 테이블은 표준 `set_updated_at` 트리거를 통해 갱신 시간을 자동 관리하며, RLS는 사용하지 않음.
- Supabase 콘솔 반영 시 `supabase/migrations/0002_create_core_tables.sql`을 실행하면 동일 구조가 구성됨.
