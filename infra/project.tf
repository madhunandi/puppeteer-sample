
provider "aws" {
  region = "ap-southeast-1"
}

resource "aws_dynamodb_table" "WalkinStore" {
  "attribute" {
    name = "id"
    type = "S"
  }

  hash_key = "id"
  name = "WalkinStore"
  read_capacity = 5
  write_capacity = 5
  tags {
    type = "walkinstore"
  }
}