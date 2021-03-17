using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class DuskElixir : InventoryItemBase
{

    public override void OnUse()
    {
        print("used dusk elixir");
        SwitchCharacter.dusk_elixir_drunk = true;
    }

    public override void OnPickup(Collider collider)
    {
    }

    public override string Name
    {
        get
        {
            return "DuskElixir";
        }
    }
}