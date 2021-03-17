using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class DawnElixir : InventoryItemBase
{

    public override void OnUse()
    {
        print("used dawn elixir");
        SwitchCharacter.dawn_elixir_drunk = true;
    }

    public override void OnPickup(Collider collider)
    {
    }

    public override string Name
    {
        get
        {
            return "DawnElixir";
        }
    }
}